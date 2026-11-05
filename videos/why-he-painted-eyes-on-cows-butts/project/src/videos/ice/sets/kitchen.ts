// THE KITCHEN (scene 8, the cookie-jar comparison): a small warm family kitchen at night, lamp-lit. Back wall z = -2.2
// with a counter, a high shelf with the COOKIES jar (x = 0.6, y = 1.95), a window showing blue night, a fridge on the left,
// a doorway on the right (mum stands in it), checker floor, a hanging lamp. Ground y = 0.
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex, rep, planksHD, beamHD } from "../paint";
import { lamp, flicker, sign } from "../setkit";
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
  const jar = new THREE.Group(); jar.position.set(0.6, 1.56, -2.02); root.add(jar);
  { const jb = new Batch(); jb.add(new THREE.CylinderGeometry(0.17, 0.15, 0.3, 18).translate(0, 0.15, 0), lam("ktJar", () => ({ color: "#f4f0e2" })));
    jb.add(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 18).translate(0, 0.32, 0), lam("ktJarLid", () => ({ color: "#2f8ad0" })));
    jb.add(new THREE.SphereGeometry(0.05, 8, 6).translate(0, 0.37, 0), lam("ktJarLid", () => ({ color: "#2f8ad0" }))); jb.build(jar); }
  sign(jar, "COOKIES", 0.26, 0.08, [0, 0.15, 0.17], 0, "#fbf3dc", "#7a3a1a");
  for (const [x, c] of [[1.25, "#c8352e"], [1.6, "#3aa36a"]] as [number, string][]) b.add(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 12).translate(x, 1.67, -2.0), lam("ktCan" + c, () => ({ color: c })));
  // window with the night outside, curtains
  b.add(new THREE.PlaneGeometry(1.2, 0.9).translate(-1.8, 2.15, -2.19), lam("ktWinM", () => ({ map: nightWin(), emissive: "#20306a" })));
  b.add(boxGeo(V(-2.45, 1.65, -2.2), V(-1.15, 1.72, -2.1)), lam("ktSill", () => ({ map: beamHD() })));
  for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.35, 1.1, 0.04).translate(-1.8 + s * 0.72, 2.15, -2.14), lam("ktCurtain", () => ({ color: "#e8664a" })));
  // fridge on the left, a table with a chair in front, a fruit bowl
  b.add(boxGeo(V(-3.7, 0, -1.4), V(-2.9, 2.0, -0.6), 1), lam("ktFridge", () => ({ color: "#f0f4f6" })));
  b.add(boxGeo(V(-2.92, 1.2, -1.3), V(-2.88, 1.6, -1.22)), lam("ktHandle", () => ({ color: "#8a929e" })));
  b.add(boxGeo(V(-2.2, 0.72, 0.6), V(-0.4, 0.78, 1.8), 1), wood);
  for (const [x, z] of [[-2.1, 0.7], [-0.5, 0.7], [-2.1, 1.7], [-0.5, 1.7]]) b.add(boxGeo(V(x - 0.04, 0, z - 0.04), V(x + 0.04, 0.72, z + 0.04)), wood);
  b.add(new THREE.SphereGeometry(0.28, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).translate(-1.3, 1.06, 1.2), lam("ktBowl", () => ({ color: "#5a8ad0" })));
  for (const [x, z, c] of [[-1.4, 1.15, "#e8a640"], [-1.2, 1.26, "#c8352e"], [-1.3, 1.08, "#9ac84a"]] as [number, number, string][]) b.add(new THREE.SphereGeometry(0.1, 8, 6).translate(x, 0.92, z), lam("ktFruit" + c, () => ({ color: c })));
  // a little step stool under the shelf (the kid stands on it)
  b.add(boxGeo(V(0.25, 0, -1.4), V(0.95, 0.42, -0.95), 1), lam("ktStool", () => ({ color: "#3a7ac8" })));
  b.build(root);
  const lamps = [lamp(root, [-0.6, 2.9, 0.2], "#ffc070", 7, 9, "hang"), lamp(root, [3.7, 2.0, -1.0], "#ffb060", 3, 6, "wall")];
  const marks: Record<string, V3> = { kid: [0.6, 0.42, -1.18], jar: [0.6, 1.99, -2.0], mom: [3.3, 0, 1.3], door: [3.9, 0, 1.3] };
  const cams: SetDef["cams"] = { main: { pos: [1.8, 1.6, 4.6], look: [1.0, 1.3, -1.0], fov: 44 } };
  return { name: "kitchen", root, marks, cams, pose: (t) => { for (const l of lamps) flicker(l, t); } };
};
