// THE KITCHEN ("He Labeled Grape Bricks": the warning, the explanation, the cake mix, the serviceman, the ending;
// earlier: the cows cookie-jar comparison): a small warm family kitchen at night, lamp-lit. Back wall z = -2.2
// with a counter, a high shelf with the COOKIES jar (x = 0.6, y = 1.95), a window showing blue night, a fridge on the left,
// a doorway on the right (mum stands in it), checker floor, a hanging lamp. Ground y = 0.
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex, rep, planksHD, beamHD } from "../paint";
import { lamp, flicker, sign, glow } from "../setkit";
import type { SetDef, SetBuilder, V3 } from "./types";

const tileTex = () => ctex("ktTile", 512, 512, (g) => {
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? "#e8dcc4" : "#b8463a"; g.fillRect(x * 64, y * 64, 64, 64); }
  g.strokeStyle = "rgba(80,50,40,0.35)"; g.lineWidth = 2; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(512, i * 64); g.stroke(); }
});
const wallTex = () => ctex("ktWall", 512, 512, (g, r) => {
  g.fillStyle = "#f2d690"; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 64) { g.fillStyle = "rgba(220,170,90,0.35)"; g.fillRect(x, 0, 24, 512); }
  for (let i = 0; i < 300; i++) { g.fillStyle = "rgba(180,130,70,0.12)"; g.beginPath(); g.arc(r() * 512, r() * 512, 2 + r() * 6, 0, 7); g.fill(); }
});
const backsplash = () => ctex("ktSplash", 512, 256, (g) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? "#ffffff" : "#bfe2ea"; g.fillRect(x * 64, y * 64, 64, 64); }
  g.strokeStyle = "rgba(90,120,130,0.4)"; g.lineWidth = 3; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.stroke(); } for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(512, i * 64); g.stroke(); }
});
const nightWin = () => ctex("ktWin", 256, 256, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#14205a"); gr.addColorStop(1, "#3a4c96"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(255,255,230,0.8)"; g.beginPath(); g.arc(r() * 256, r() * 170, 1 + r() * 1.5, 0, 7); g.fill(); }
  g.fillStyle = "#fff6d8"; g.beginPath(); g.arc(190, 60, 20, 0, 7); g.fill();
  g.fillStyle = "#1a1a3a"; g.beginPath(); g.moveTo(0, 256); for (let x = 0; x <= 256; x += 16) g.lineTo(x, 200 + 20 * Math.sin(x * 0.05)); g.lineTo(256, 256); g.fill();
});

export const kitchen: SetBuilder = () => {
  const root = new THREE.Group(), b = new Batch();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 8).rotateX(-Math.PI / 2), lam("ktFloor", () => ({ map: rep(tileTex(), 2.5, 2) }))); floor.receiveShadow = true; root.add(floor);
  const wall = lam("ktWallM", () => ({ map: rep(wallTex(), 3, 1) }));
  b.add(boxGeo(V(-5, 0, -2.4), V(5, 3.4, -2.2), 1), wall);                       // back wall
  b.add(boxGeo(V(-4.0, 0, -2.4), V(-3.8, 3.4, 4), 1), wall);                      // left wall
  b.add(boxGeo(V(3.8, 0, -2.4), V(4.0, 3.4, 0.6), 1), wall); b.add(boxGeo(V(3.8, 2.3, 0.6), V(4.0, 3.4, 2.0), 1), wall); b.add(boxGeo(V(3.8, 0, 2.0), V(4.0, 3.4, 4), 1), wall); // right wall with a doorway
  b.add(boxGeo(V(-5, 3.4, -2.4), V(5, 3.5, 4), 1), lam("ktCeil", () => ({ color: "#f6e8c8" })));
  // counter + cupboards along the back wall
  const wood = lam("ktWood", () => ({ map: rep(planksHD(), 0.6, 0.3) })), top = lam("ktTop", () => ({ color: "#e8e2d6" }));
  b.add(boxGeo(V(-3.7, 0, -2.2), V(1.8, 0.9, -1.55), 1), wood); b.add(boxGeo(V(-3.75, 0.9, -2.2), V(1.85, 0.97, -1.5), 1), top);
  for (let x = -3.4; x < 1.8; x += 0.9) { b.add(boxGeo(V(x, 0.12, -1.55), V(x + 0.78, 0.8, -1.52)), lam("ktDoor", () => ({ color: "#c96a3a" }))); b.add(new THREE.SphereGeometry(0.035, 6, 4).translate(x + 0.66, 0.6, -1.5), lam("ktKnob", () => ({ color: "#f2c230" }))); }
  b.add(new THREE.PlaneGeometry(5.5, 0.7).translate(-0.95, 1.33, -2.19), lam("ktSplashM", () => ({ map: backsplash() })));
  // the high shelf with the cookie jar (and a few pots)
  b.add(boxGeo(V(-0.3, 1.5, -2.2), V(1.9, 1.56, -1.85)), lam("ktShelf", () => ({ map: beamHD() })));
  // the high shelf holds the grape bricks (count c.shelf, default 6): purple blocks with cream labels facing the room
  const brickTex = ctex("ktBrick", 256, 128, (g) => { g.fillStyle = "#6a2c7e"; g.fillRect(0, 0, 256, 128); g.fillStyle = "#fbf3dc"; g.fillRect(28, 18, 200, 92); g.fillStyle = "#5a1f6e"; g.font = "900 34px DejaVu Sans, Arial"; g.textAlign = "center"; g.fillText("GRAPE", 128, 56); g.fillText("BRICK", 128, 92); g.fillStyle = "#c8352e"; g.fillRect(28, 100, 200, 8); });
  const bTop = lam("ktBrickTop", () => ({ color: "#8a4aa0" })), bFace = lam("ktBrickFace", () => ({ map: brickTex }));
  const shelfBricks: THREE.Mesh[] = [];
  for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.13, 0.17), [bTop, bTop, bTop, bTop, bFace, bTop]); m.position.set(-0.1 + k * 0.22, 1.625, -2.0); m.castShadow = true; root.add(m); shelfBricks.push(m); }
  for (const [x, c] of [[1.25, "#c8352e"], [1.6, "#3aa36a"]] as [number, string][]) b.add(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 12).translate(x, 1.67, -2.0), lam("ktCan" + c, () => ({ color: c })));
  // window with the night outside, curtains
  b.add(new THREE.PlaneGeometry(1.2, 0.9).translate(-1.8, 2.15, -2.19), lam("ktWinM", () => ({ map: nightWin(), emissive: "#20306a" })));
  b.add(boxGeo(V(-2.45, 1.65, -2.2), V(-1.15, 1.72, -2.1)), lam("ktSill", () => ({ map: beamHD() })));
  for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.35, 1.1, 0.04).translate(-1.8 + s * 0.72, 2.15, -2.14), lam("ktCurtain", () => ({ color: "#e8664a" })));
  // fridge on the left, a table with a chair in front, a fruit bowl
  // the black iron stove (replaces the fridge): oven door facing +x, a pot, the stovepipe up into the ceiling
  const ironM = lam("ktIron", () => ({ color: "#2c2a34" })), chromeM = lam("ktChrome", () => ({ color: "#c9ced6" }));
  b.add(boxGeo(V(-3.7, 0.12, -1.45), V(-2.85, 0.95, -0.55), 1), ironM);
  for (const [x, z] of [[-3.65, -1.4], [-2.9, -1.4], [-3.65, -0.6], [-2.9, -0.6]]) b.add(boxGeo(V(x - 0.04, 0, z - 0.04), V(x + 0.04, 0.12, z + 0.04)), ironM);
  b.add(boxGeo(V(-2.86, 0.22, -1.3), V(-2.82, 0.75, -0.7)), lam("ktOven", () => ({ color: "#3a3844" })));
  b.add(boxGeo(V(-2.82, 0.66, -1.15), V(-2.78, 0.7, -0.85)), chromeM);
  b.add(new THREE.CylinderGeometry(0.2, 0.18, 0.2, 14).translate(-3.25, 1.05, -1.0), lam("ktPot", () => ({ color: "#c8352e" })));
  b.add(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 10).translate(-3.5, 2.2, -1.3), ironM);
  glow(root, [-2.84, 0.48, -1.0], "#ff9a40", 0.35, 0.5);
  b.add(boxGeo(V(-2.2, 0.72, 0.6), V(-0.4, 0.78, 1.8), 1), wood);
  for (const [x, z] of [[-2.1, 0.7], [-0.5, 0.7], [-2.1, 1.7], [-0.5, 1.7]]) b.add(boxGeo(V(x - 0.04, 0, z - 0.04), V(x + 0.04, 0.72, z + 0.04)), wood);
  b.add(new THREE.SphereGeometry(0.28, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).translate(-1.3, 1.06, 1.2), lam("ktBowl", () => ({ color: "#5a8ad0" })));
  for (const [x, z, c] of [[-1.4, 1.15, "#e8a640"], [-1.2, 1.26, "#c8352e"], [-1.3, 1.08, "#9ac84a"]] as [number, number, string][]) b.add(new THREE.SphereGeometry(0.1, 8, 6).translate(x, 0.92, z), lam("ktFruit" + c, () => ({ color: c })));
  // a little step stool under the shelf (the kid stands on it)
  b.add(boxGeo(V(0.25, 0, -1.4), V(0.95, 0.42, -0.95), 1), lam("ktStool", () => ({ color: "#3a7ac8" })));
  // the pantry cupboard right of the counter (x 2.0..3.4): two doors (hinged groups, c.cupboard 0..1 opens them), three
  // shelves with jugs inside (c.jugGlow 0..1: they glow purple at the ending)
  const pine = lam("ktPine", () => ({ map: rep(planksHD(), 0.5, 0.5) })), PX0 = 2.0, PX1 = 3.4, PZ = -1.62;
  b.add(boxGeo(V(PX0, 0, -2.2), V(PX1, 2.35, -2.12), 1), pine);
  for (const x of [PX0, PX1 - 0.06]) b.add(boxGeo(V(x, 0, -2.2), V(x + 0.06, 2.35, PZ), 1), pine);
  b.add(boxGeo(V(PX0, 2.29, -2.2), V(PX1, 2.35, PZ), 1), pine); b.add(boxGeo(V(PX0, 0, -2.2), V(PX1, 0.12, PZ), 1), pine);
  for (const y of [0.75, 1.5]) b.add(boxGeo(V(PX0 + 0.06, y, -2.12), V(PX1 - 0.06, y + 0.04, PZ - 0.02)), pine);
  const jugGlass = new THREE.MeshPhongMaterial({ color: "#d8ecf4", specular: "#ffffff", shininess: 90, transparent: true, opacity: 0.55, depthWrite: false });
  const jugJuice = new THREE.MeshLambertMaterial({ color: "#6a1f78", emissive: "#000000" });
  const pantryJugs: THREE.Mesh[] = [];
  for (const y of [0.12, 0.79, 1.54]) for (const x of [2.3, 2.7, 3.1]) {
    const j1 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.36, 14).translate(x, y + 0.18, -1.9), jugGlass); root.add(j1);
    const j2 = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.125, 0.26, 14).translate(x, y + 0.14, -1.9), jugJuice); root.add(j2); pantryJugs.push(j2);
    b.add(new THREE.CylinderGeometry(0.045, 0.06, 0.12, 10).translate(x, y + 0.42, -1.9), lam("ktCork", () => ({ color: "#c9a27a" })));
  }
  const doors: THREE.Group[] = [];
  for (const s2 of [-1, 1]) { const hinge = s2 < 0 ? PX0 : PX1, g = new THREE.Group(); g.position.set(hinge, 0.12, PZ + 0.02); root.add(g); doors.push(g);
    const db = new Batch(); db.add(boxGeo(V(s2 < 0 ? 0 : -0.7, 0, -0.03), V(s2 < 0 ? 0.7 : 0, 2.17, 0.03), 1), lam("ktDoorP", () => ({ color: "#c96a3a" })));
    db.add(boxGeo(V(s2 < 0 ? 0.08 : -0.62, 0.15, 0.03), V(s2 < 0 ? 0.62 : -0.08, 2.02, 0.05)), lam("ktDoorPanel", () => ({ color: "#b85a30" })));
    db.add(new THREE.SphereGeometry(0.035, 6, 4).translate(s2 < 0 ? 0.62 : -0.62, 1.1, 0.07), lam("ktKnob", () => ({ color: "#f2c230" }))); db.build(g); }
  // the wall calendar (c.day 1..21: the big day number on a JUNE page, a red ring on 21)
    const calTex = (d: number) => ctex("ktCal" + d, 256, 320, (g) => { g.fillStyle = "#fbf6e8"; g.fillRect(0, 0, 256, 320); g.fillStyle = "#c8352e"; g.fillRect(0, 0, 256, 64);
    g.fillStyle = "#fbf6e8"; g.font = "900 40px DejaVu Serif, Georgia"; g.textAlign = "center"; g.fillText("JUNE", 128, 47);
    g.fillStyle = d >= 21 ? "#6a2c7e" : "#2a2a3a"; g.font = "900 170px DejaVu Serif, Georgia"; g.fillText(String(d), 128, 250);
    if (d >= 21) { g.strokeStyle = "#c8352e"; g.lineWidth = 10; g.beginPath(); g.ellipse(128, 196, 104, 90, -0.1, 0, 7); g.stroke(); }
    g.fillStyle = "#7a5432"; g.fillRect(118, 2, 20, 10); });
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.58), new THREE.MeshLambertMaterial({ color: "#ffffff", map: calTex(1) })); cal.position.set(2.7, 2.84, -2.185); root.add(cal);
  // the gallon jug on the counter (c.jugFill 0..1 = the purple level), c.jugGlow also lights it
  const JUG: V3 = [0.15, 0.97, -1.86];
  const jugG = new THREE.Group(); root.add(jugG);
  { const jb = new Batch(); jb.add(new THREE.CylinderGeometry(0.17, 0.19, 0.46, 16).translate(JUG[0], JUG[1] + 0.23, JUG[2]), jugGlass);
  jb.add(new THREE.CylinderGeometry(0.06, 0.12, 0.14, 12).translate(JUG[0], JUG[1] + 0.53, JUG[2]), jugGlass);
  jb.add(new THREE.TorusGeometry(0.08, 0.02, 6, 12, Math.PI).rotateZ(-Math.PI / 2).translate(JUG[0] + 0.19, JUG[1] + 0.42, JUG[2]), jugGlass); jb.build(jugG); }
  const jugIn = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.175, 1, 16).translate(0, 0.5, 0), jugJuice); jugIn.position.set(JUG[0], JUG[1] + 0.02, JUG[2]); root.add(jugIn);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.175, 1, 16).translate(0, 0.5, 0), new THREE.MeshLambertMaterial({ color: "#a8d8ea", transparent: true, opacity: 0.6 })); water.position.copy(jugIn.position); root.add(water);
  b.build(root);
  const lamps = [lamp(root, [-0.6, 2.9, 0.2], "#ffc070", 7, 9, "hang"), lamp(root, [3.7, 2.0, -1.0], "#ffb060", 3, 6, "wall")];
  const marks: Record<string, V3> = { kid: [0.6, 0.42, -1.18], mom: [3.3, 0, 1.3], door: [3.9, 0, 1.3], jug: JUG, mumCounter: [0.15, 0, -1.12], kidTable: [-1.0, 0, 2.3],
    pantry: [2.7, 0, -1.05], stove: [-2.45, 0, -0.95], oven: [-2.82, 0.48, -1.0], calendar: [2.7, 2.84, -2.18], shelf: [0.45, 1.62, -2.0], serviceIn: [3.6, 0, 1.3], serviceJug: [0.85, 0, -1.15] };
  const cams: SetDef["cams"] = { main: { pos: [1.8, 1.6, 4.6], look: [1.0, 1.3, -1.0], fov: 44 } };
  return { name: "kitchen", root, marks, cams, pose: (t, c) => {
    for (const l of lamps) flicker(l, t);
    const nb = Math.round(c.shelf ?? 6); shelfBricks.forEach((m, i) => (m.visible = i < nb));
    const op = c.cupboard ?? 0; doors[0].rotation.y = -op * 1.9; doors[1].rotation.y = op * 1.9;
    const gl = c.jugGlow ?? 0; jugJuice.emissive.setRGB(0.42 * gl, 0.08 * gl, 0.5 * gl);
    const d = Math.max(1, Math.min(21, Math.round(c.day ?? 1))); (cal.material as THREE.MeshLambertMaterial).map = calTex(d);
    const fill = Math.max(0.001, c.jugFill ?? 0), wat = Math.max(0.001, c.jugWater ?? 0); jugIn.scale.y = 0.42 * fill; water.scale.y = 0.42 * wat; water.visible = wat > 0.01 && fill < 0.98; jugIn.visible = fill > 0.01; const hide = (c.jugHide ?? 0) > 0.5; jugG.visible = !hide; if (hide) { jugIn.visible = false; water.visible = false; }
    void pantryJugs;
  } };
};
