// WASHINGTON OFFICE (scene 4 cut-in, "He Labeled Grape Bricks"): the lawyer's office at the Justice Department, bright day.
// Room x -3.2..3.2, z -2.4 (back wall, a tall window on blue sky with a white capitol dome) .. 3, ceiling 3.4. A wide oak
// desk (x -1.3..1.3, z -0.55..0.35, top 0.82) with a green banker's lamp, an ink pad, a paper (the ruling) at the front
// edge, an in-tray; a flag on a pole (left of the window), a framed DEPT. OF JUSTICE seal board (right), a filing cabinet,
// a bookcase on the left wall, a ceiling fan (turns). Controls: c.fan (speed, default 1). Marks: lawyer (behind the desk),
// paper (top of the ruling sheet), door.
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex, rep, planksHD, beamHD } from "../paint";
import { lamp, sign, glow } from "../setkit";
import type { SetDef, SetBuilder, V3 } from "./types";

const wallTex = () => ctex("ofWall", 512, 512, (g, r) => {
  g.fillStyle = "#e8dcc0"; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 48) { g.fillStyle = "rgba(196,170,120,0.28)"; g.fillRect(x, 0, 6, 512); }
  for (let i = 0; i < 260; i++) { g.fillStyle = "rgba(170,140,100,0.1)"; g.beginPath(); g.arc(r() * 512, r() * 512, 2 + r() * 6, 0, 7); g.fill(); }
  g.fillStyle = "#7a5432"; g.fillRect(0, 430, 512, 82); g.fillStyle = "#9a6c42"; g.fillRect(0, 430, 512, 10);   // wainscot
});
const skyTex = () => ctex("ofSky", 512, 768, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 768); gr.addColorStop(0, "#3f8fe0"); gr.addColorStop(1, "#bfe0f6"); g.fillStyle = gr; g.fillRect(0, 0, 512, 768);
  for (let i = 0; i < 5; i++) { g.fillStyle = "rgba(255,255,255,0.85)"; const x = r() * 512, y = 80 + r() * 240; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + k * 26, y + Math.sin(k) * 8, 26 + r() * 14, 0, 7); g.fill(); } }
  // the white capitol: wide base, drum with columns, the dome, the lantern
  g.fillStyle = "#f4f2ec"; g.fillRect(70, 560, 372, 208); g.fillRect(150, 470, 212, 100);
  g.strokeStyle = "#c9c4b8"; g.lineWidth = 4; for (let x = 160; x < 360; x += 18) { g.beginPath(); g.moveTo(x, 478); g.lineTo(x, 566); g.stroke(); }
  g.beginPath(); g.ellipse(256, 470, 108, 120, 0, Math.PI, 0); g.fill(); g.stroke();
  g.fillRect(238, 330, 36, 30); g.beginPath(); g.arc(256, 330, 18, Math.PI, 0); g.fill();
  g.fillStyle = "#2f7a3a"; g.fillRect(0, 700, 512, 68); for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(i * 64 + 20, 700, 36, Math.PI, 0); g.fill(); }
});
const flagTex = () => ctex("ofFlag", 384, 220, (g) => {
  for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? "#f6f1e6" : "#c8323a"; g.fillRect(0, i * 17, 384, 17); }
  g.fillStyle = "#2c4a9a"; g.fillRect(0, 0, 160, 119); g.fillStyle = "#f6f1e6"; for (let y = 0; y < 6; y++) for (let x = 0; x < 8; x++) { g.beginPath(); g.arc(12 + x * 19 + (y % 2) * 9, 11 + y * 19, 3.2, 0, 7); g.fill(); }
});

export const office: SetBuilder = () => {
  const root = new THREE.Group(), b = new Batch();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 7).rotateX(-Math.PI / 2).translate(0, 0, 0.3), lam("ofFloor", () => ({ map: rep(planksHD(), 2, 2) }))); floor.receiveShadow = true; root.add(floor);
  const wall = lam("ofWallM", () => ({ map: rep(wallTex(), 3, 1) }));
  b.add(boxGeo(V(-3.4, 0, -2.6), V(-0.9, 3.4, -2.4), 1), wall); b.add(boxGeo(V(0.9, 0, -2.6), V(3.4, 3.4, -2.4), 1), wall);   // back wall around the window
  b.add(boxGeo(V(-0.9, 0, -2.6), V(0.9, 0.7, -2.4), 1), wall); b.add(boxGeo(V(-0.9, 3.0, -2.6), V(0.9, 3.4, -2.4), 1), wall);
  b.add(boxGeo(V(-3.4, 0, -2.6), V(-3.2, 3.4, 3.2), 1), wall); b.add(boxGeo(V(3.2, 0, -2.6), V(3.4, 3.4, 3.2), 1), wall);
  b.add(boxGeo(V(-3.4, 3.4, -2.6), V(3.4, 3.5, 3.2), 1), lam("ofCeil", () => ({ color: "#f4ead6" })));
  // the window: sky + capitol, a white frame with mullions, a sill
  b.add(new THREE.PlaneGeometry(1.8, 2.3).translate(0, 1.85, -2.55), lam("ofSkyM", () => ({ map: skyTex(), emissive: "#6a8ab0" })));
  const white = lam("ofTrim", () => ({ color: "#f6f1e6" }));
  for (const x of [-0.92, 0, 0.92]) b.add(boxGeo(V(x - 0.04, 0.7, -2.42), V(x + 0.04, 3.0, -2.36)), white);
  for (const y of [0.7, 1.85, 3.0]) b.add(boxGeo(V(-0.95, y - 0.04, -2.42), V(0.95, y + 0.04, -2.36)), white);
  b.add(boxGeo(V(-1.05, 0.66, -2.42), V(1.05, 0.72, -2.2)), white);
  // the desk
  const oak = lam("ofOak", () => ({ map: rep(beamHD(), 0.6, 0.3) }));
  b.add(boxGeo(V(-1.35, 0.76, -0.6), V(1.35, 0.84, 0.4), 1), oak);
  for (const s of [-1, 1]) b.add(boxGeo(V(s * 1.3 - 0.4, 0, -0.55), V(s * 1.3 + 0.4, 0.76, 0.35), 1), oak);
  b.add(boxGeo(V(-0.9, 0.06, 0.3), V(0.9, 0.7, 0.34)), oak);
  for (const s of [-1, 1]) for (const y of [0.2, 0.42, 0.62]) b.add(new THREE.SphereGeometry(0.025, 6, 4).translate(s * 1.3, y, 0.37), lam("ofBrass", () => ({ color: "#e0b04a" })));
  b.add(boxGeo(V(-1.2, 0.84, -0.5), V(-0.55, 0.88, 0.0)), lam("ofBlotter", () => ({ color: "#2f6b4f" })));
  // the banker's lamp (green shade), the ink pad, an in-tray with papers, the ruling sheet at the front edge
  b.add(new THREE.CylinderGeometry(0.08, 0.1, 0.04, 12).translate(0.95, 0.86, -0.35), lam("ofBrass", () => ({ color: "#e0b04a" })));
  b.add(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6).translate(0.95, 1.02, -0.35), lam("ofBrass", () => ({ color: "#e0b04a" })));
  b.add(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 16, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).translate(0.95, 1.17, -0.33), lam("ofShade", () => ({ color: "#2f8a4a", side: THREE.DoubleSide })));
  glow(root, [0.95, 1.1, -0.3], "#fff0b0", 0.3, 0.5);
  b.add(boxGeo(V(0.35, 0.84, -0.15), V(0.6, 0.86, 0.05)), lam("ofInk", () => ({ color: "#3a2a4a" })));
  b.add(boxGeo(V(-1.25, 0.84, -0.55), V(-0.75, 0.94, -0.2)), oak); for (let i = 0; i < 5; i++) b.add(boxGeo(V(-1.2, 0.88 + i * 0.012, -0.52), V(-0.8, 0.89 + i * 0.012, -0.23)), white);
  b.add(new THREE.PlaneGeometry(0.42, 0.56).rotateX(-Math.PI / 2).translate(0, 0.845, 0.0), lam("ofPaper", () => ({ map: ctex("ofRuling", 256, 340, (g) => {
    g.fillStyle = "#fbf6e8"; g.fillRect(0, 0, 256, 340); g.fillStyle = "#2a2a3a"; g.font = "900 22px DejaVu Serif, Georgia"; g.textAlign = "center"; g.fillText("RULING", 128, 40);
    g.fillStyle = "rgba(40,40,60,0.55)"; for (let i = 0; i < 11; i++) g.fillRect(28, 64 + i * 22, 200 - (i % 3) * 30, 6);
    g.fillStyle = "#6a2c7e"; g.font = "900 18px DejaVu Sans"; g.fillText("GRAPE BRICKS", 128, 322); }) })));
  // the flag (left of the window), the seal board (right), a filing cabinet, a bookcase
  b.add(new THREE.CylinderGeometry(0.025, 0.025, 2.6, 8).translate(-1.6, 1.3, -2.1), lam("ofBrass", () => ({ color: "#e0b04a" })));
  b.add(new THREE.SphereGeometry(0.06, 8, 6).translate(-1.6, 2.62, -2.1), lam("ofBrass", () => ({ color: "#e0b04a" })));
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55, 12, 4).translate(0.45, 0, 0), lam("ofFlagM", () => ({ map: flagTex(), side: THREE.DoubleSide })));
  flag.position.set(-1.6, 2.25, -2.1); flag.rotation.y = 0.5; root.add(flag);
  sign(root, "DEPT. OF JUSTICE", 1.3, 0.34, [1.9, 2.35, -2.38], 0, "#2c3e64", "#f2d37a");
  b.add(boxGeo(V(2.3, 0, -2.3), V(3.0, 1.35, -1.7), 1), lam("ofCab", () => ({ color: "#5a6e7a" })));
  for (const y of [0.3, 0.75, 1.15]) b.add(boxGeo(V(2.45, y, -1.69), V(2.85, y + 0.06, -1.66)), lam("ofBrass", () => ({ color: "#e0b04a" })));
  b.add(boxGeo(V(-3.15, 0, -1.6), V(-2.75, 2.6, 1.2), 1), oak);
  { const cols = ["#8a2a2a", "#2f5d9a", "#3a7a4a", "#c9a227", "#5a3a6e", "#a85a2a"]; let k = 0;
    for (const y of [0.25, 0.9, 1.55, 2.15]) for (let z = -1.5; z < 1.1; z += 0.12) b.add(boxGeo(V(-2.78, y, z), V(-2.74 - 0.2, y + 0.38 + ((k * 7) % 5) * 0.03, z + 0.09)), lam("ofBook" + (k % 6), () => ({ color: cols[k++ % 6] }))); }
  b.build(root);
  // the ceiling fan
  const fan = new THREE.Group(); fan.position.set(0, 3.2, 0.4); root.add(fan);
  { const fb = new Batch(); fb.add(new THREE.CylinderGeometry(0.1, 0.12, 0.16, 12), lam("ofBrass", () => ({ color: "#e0b04a" }))); for (let i = 0; i < 4; i++) fb.add(new THREE.BoxGeometry(0.9, 0.02, 0.16).translate(0.5, -0.04, 0).rotateY((i * Math.PI) / 2), oak); fb.build(fan); }
  const lamps = [lamp(root, [0.95, 1.4, 0.0], "#ffe0a0", 3, 5, "table")];
  void lamps;
  const marks: Record<string, V3> = { lawyer: [0.0, 0, -1.05], paper: [0, 0.85, 0.0], door: [2.6, 0, 2.6], stamp: [0.2, 0.85, 0.0] };
  const cams: SetDef["cams"] = { main: { pos: [0.4, 1.5, 3.1], look: [0, 1.1, -0.6], fov: 42 } };
  return { name: "office", root, marks, cams, pose: (t, c) => { fan.rotation.y = t * 2.2 * (c.fan ?? 1); flag.rotation.y = 0.5 + 0.03 * Math.sin(t * 0.8); } };
};
