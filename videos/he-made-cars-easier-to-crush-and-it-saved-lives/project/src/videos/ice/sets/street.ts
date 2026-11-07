// TODAY: A CITY STREET, late afternoon (scene 10, the ending). A two-lane road (x -12..12, z 0..6) with lane lines and a
// zebra crossing, sidewalks either side, a glass-front corner cafe "BEAN THERE" with an awning and bistro tables, a
// bookshop, a traffic light (cycling), a modern lamp post, a bike rack with a bike, street trees in square planters,
// a fire hydrant, a parking sign. THE WRECK: a teal modern hatchback has bumped a steel bollard at the kerb (x 0.5,
// z 6.6): its nose is crumpled up (crush 0.75), the cabin and doors perfectly fine. Background traffic: a red
// hatchback drives past (c.pass 0..1 crosses the frame). Sidewalk marks for the old man and the driver.
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex, rep } from "../paint";
import { glow, rod } from "../setkit";
import { roundTree, leafTex } from "./innerkit_b";
import { fitText } from "./portkit_common";
import { col, shiny, SANS, asphaltTex } from "./desertkit";
import { sedan } from "./sedan";
import type { SetDef, SetBuilder, V3 } from "./types";

export const street: SetBuilder = () => {
  const root = new THREE.Group(), b = new Batch();
  { const rd = new THREE.Mesh(new THREE.PlaneGeometry(36, 6).rotateX(-Math.PI / 2), lam("stRoad", () => ({ map: rep(asphaltTex(true), 7, 1) }))); rd.position.set(0, 0, 3); rd.receiveShadow = true; root.add(rd); }
  const walk = lam("stWalk", () => ({ map: rep(ctex("stPave", 512, 512, (g, r) => { g.fillStyle = "#cfc9be"; g.fillRect(0, 0, 512, 512); g.strokeStyle = "#a8a296"; g.lineWidth = 4; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(512, i * 128); g.stroke(); } for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(80,70,60,${0.06 * r()})`; g.fillRect(r() * 512, r() * 512, 4 + r() * 10, 3); } }), 9, 2) }));
  b.add(boxGeo(V(-18, 0, 6), V(18, 0.14, 10.5)), walk); b.add(boxGeo(V(-18, 0, -4), V(18, 0.14, 0)), walk);
  b.add(boxGeo(V(-18, 0, 5.95), V(18, 0.15, 6.15)), lam("stKerb", () => ({ color: "#e8e2d4" })));
  // zebra crossing
  for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 5.4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#f4f1ea" })); m.position.set(-7 + i * 0.9, 0.006, 3); root.add(m); }
  // shopfronts along z = 10.5: BEAN THERE cafe (glass, awning, warm inside) + a bookshop + brick blocks
  const sign = (key: string, w: number, h: number, pos: V3, draw: (g: CanvasRenderingContext2D) => void, cw = 1024, ch = 256, yaw = Math.PI) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: ctex(key, cw, ch, draw) })); m.position.set(...pos); m.rotation.y = yaw; root.add(m); return m; };
  const brickC = ["#b0634a", "#c99a6a", "#8a5a7a", "#6a8aaa"];
  for (let i = 0; i < 6; i++) { const x0 = -15 + i * 5; b.add(boxGeo(V(x0, 0, 10.5), V(x0 + 4.9, 6 + (i % 2) * 1.5, 12)), lam("stBld" + i, () => ({ color: brickC[i % 4] }))); for (let k = 0; k < 3; k++) b.add(boxGeo(V(x0 + 0.5 + k * 1.5, 3.6, 10.45), V(x0 + 1.4 + k * 1.5, 5.0, 10.5)), lam("stUpWin", () => ({ color: "#cfe6f2" }))); }
  // the cafe front (x -2.5..2.5): glass, warm interior glow, a striped awning, the BEAN THERE board, bistro tables
  { const gw = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.6), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffd9a0") })); gw.position.set(0, 1.45, 10.44); gw.rotation.y = Math.PI; root.add(gw);
    for (const x of [-2.4, -0.8, 0.8, 2.4]) b.add(boxGeo(V(x - 0.05, 0.14, 10.38), V(x + 0.05, 2.8, 10.44)), col("#26222c"));
    sign("stCafe", 4.2, 0.7, [0, 3.15, 10.42], (g) => { g.fillStyle = "#26222c"; g.fillRect(0, 0, 1024, 170); g.fillStyle = "#f2c230"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "BEAN THERE  COFFEE", 512, 88, 960, 100, SANS); }, 1024, 170);
    const awn = ctex("stAwn", 512, 128, (g) => { for (let x = 0; x < 512; x += 64) { g.fillStyle = (x / 64) % 2 ? "#f4f1ea" : "#2a9d9a"; g.fillRect(x, 0, 64, 128); } });
    const am = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 1.2), lam("stAwnM", () => ({ map: awn, side: THREE.DoubleSide }))); am.position.set(0, 2.75, 9.95); am.rotation.set(-0.9, Math.PI, 0); root.add(am);
    for (const [x, z] of [[-1.6, 8.6], [1.4, 8.7]] as [number, number][]) { b.add(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 18).translate(x, 0.88, z), col("#26222c")); rod(root, [x, 0.14, z], [x, 0.86, z], 0.025, col("#26222c")); for (const s of [-1, 1]) b.add(boxGeo(V(x + s * 0.55 - 0.18, 0.55, z - 0.18), V(x + s * 0.55 + 0.18, 0.6, z + 0.18)), col("#2a9d9a")); } }
  sign("stBooks", 3.0, 0.5, [7.5, 3.1, 10.42], (g) => { g.fillStyle = "#6a3a5a"; g.fillRect(0, 0, 1024, 170); g.fillStyle = "#fff4d6"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "PAGE TURNERS", 512, 88, 940, 100, SANS); }, 1024, 170);
  { const bw = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.2), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffe6c0") })); bw.position.set(7.5, 1.3, 10.44); bw.rotation.y = Math.PI; root.add(bw); }
  // traffic light (cycles), lamp post, bike rack + bike, trees in planters, hydrant, parking sign, bollard
  const TL: V3 = [-4.2, 0, 6.6];
  rod(root, [TL[0], 0.14, TL[2]], [TL[0], 3.2, TL[2]], 0.06, col("#3a3f4a"));
  b.add(boxGeo(V(TL[0] - 0.17, 2.4, TL[2] - 0.12), V(TL[0] + 0.17, 3.3, TL[2] + 0.12)), col("#26222c"));
  const lights = ["#e8402e", "#f2c230", "#3fd06a"].map((c, i) => glow(root, [TL[0], 3.15 - i * 0.3, TL[2] - 0.14], c, 0.32, 0));
  rod(root, [6.0, 0.14, 6.6], [6.0, 4.6, 6.6], 0.06, col("#3a3f4a")); rod(root, [6.0, 4.6, 6.6], [5.2, 4.7, 6.6], 0.04, col("#3a3f4a")); b.add(boxGeo(V(4.9, 4.55, 6.45), V(5.5, 4.7, 6.75)), col("#3a3f4a")); glow(root, [5.2, 4.5, 6.6], "#fff2d8", 0.7, 0.7);
  for (let k = 0; k < 3; k++) b.add(new THREE.TorusGeometry(0.32, 0.03, 6, 18, Math.PI).translate(-8.2 + k * 0.5, 0.14, 7.2), col("#9aa0ac"));
  const leaf = lam("stLeaf", () => ({ map: leafTex("stL", "#4a9a5a", "#8ad08a", "#2a6a3a") })), bark = lam("stBark", () => ({ color: "#6b4a2f" }));
  for (const x of [-10, 3.2, 10.5]) { b.add(boxGeo(V(x - 0.5, 0.14, 8.6), V(x + 0.5, 0.5, 9.6)), col("#8a8478")); roundTree(b, x, 9.1, 3.6, 21 + x, leaf, bark, 0.5); }
  b.add(new THREE.CylinderGeometry(0.14, 0.17, 0.62, 14).translate(-2.6, 0.45, 6.9), shiny("stHydrant", "#c8352e", 40));
  const BOL: V3 = [0.5, 0, 6.45];
  b.add(new THREE.CylinderGeometry(0.11, 0.12, 0.95, 14).translate(BOL[0], 0.62, BOL[2]), shiny("stBollard", "#3a3f4a", 60)); b.add(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 14).translate(BOL[0], 0.85, BOL[2]), col("#f2c230"));
  // far-side: a row of parked-car silhouettes is skipped; a low wall + bushes on the near-camera side (z -4..0) stays off frame
  b.build(root);
  // THE WRECK: teal hatchback nosed into the bollard (crumpled front, intact cabin); the passing red hatchback
  const wreck = sedan(root, { style: "modern", body: "#2a9d9a", roof: "#2a9d9a" });
  wreck.g.position.set(BOL[0] - 0.2, 0, BOL[2] - wreck.NOSE - 0.05 + 0.65 * 1.05 * 0.75); wreck.g.rotation.y = 0; // nose toward +z (the kerb)
  wreck.g.position.z = BOL[2] - 0.15 - (wreck.NOSE - 1.05 * 0.65 * 0.75);
  const passer = sedan(root, { style: "modern", body: "#d8402e", roof: "#d8402e" });
  const marks: Record<string, V3> = {
    wreck: [wreck.g.position.x, 0, wreck.g.position.z], bollard: BOL, oldMan: [BOL[0] + 1.25, 0.14, 7.35], driver: [BOL[0] - 0.95, 0.14, 7.1],
    cafe: [0, 0, 10.2], walker: [-6.5, 0.14, 8.2],
  };
  const cams = { wreck: { pos: [3.6, 1.5, 1.2] as V3, look: [0.4, 0.9, 6.4] as V3, fov: 42 } };
  return {
    name: "street", root, marks, cams,
    pose: (t, c) => {
      wreck.set({ crush: 0.75, steam: c.steam ?? 0.4, t, door: c.wdoor ?? 0.55 });
      const pk = c.pass ?? -1; passer.g.visible = pk >= 0 && pk <= 1;
      if (passer.g.visible) { passer.g.position.set(-16 + 32 * pk, 0, 1.6); passer.g.rotation.y = Math.PI / 2; passer.set({ dist: 32 * pk, t }); }
      const cyc = (t % 9) / 9, st = cyc < 0.45 ? 2 : cyc < 0.55 ? 1 : 0;
      lights.forEach((s, i) => { (s.material as THREE.SpriteMaterial).opacity = i === st ? 0.95 : 0.06; });
    },
  };
};
