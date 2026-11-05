// A 1920s first-class train compartment at golden dusk (light `train`). The train runs along +x. Compartment
// x -1.2..1.2 (end walls), window wall z -1.15 (big window x -0.7..0.7, y 0.8..1.8, the French countryside scrolling
// past outside), corridor partition z +1.15 with a glazed sliding door (x -0.42..0.42) and two glazed side lights;
// the corridor (z 1.15..2.25) with its own windows onto the other side of the line. Mahogany marquetry walls, brass
// fittings, red velvet button-tufted benches facing each other (A on -x for Lustig, B on +x), luggage racks with
// cases and a hatbox, travel posters + mirror, a fold-down table under the window (tea cup, vase, newspaper),
// a swinging ceiling lamp + twin wall sconces, a leather suitcase on Lustig's bench (lid opens).
// Outside (both sides, always moving with time at 20 m/s): telegraph poles + sagging wires (window side flicks past,
// dimming the window light), hedges, poplars, haystacks, farmhouses, wheat / lavender fields (scrolling textures),
// far hills. The carriage interior rocks gently (roll + rail-joint bob) and the lamp swings.
//
// Story controls (c): case 0..1 opens the suitcase lid | lean -1..1 extra carriage sway (roll, e.g. on a curve) |
// door 0..1 slides the compartment door open (default 0, closed glass).
// Marks (feet): lustigSit = Lustig's window seat on bench A (sitting pose: feet at y 0.36 on the cushion front) |
// lustigStand = standing between the benches | passenger = the window seat opposite on bench B (sitting) |
// passenger2 = B's corridor-side seat (sitting) | corridorA / corridorB = the conductor's walk (start / end, outside
// the door in the corridor) | doorway = in the open doorway | suitcase = the case on bench A's middle seat (top of
// the case, for cash particles).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { ctex, rng, beamHD, rep } from "../paint";
import { NOINK } from "../ink";
import { glow, shaft, rod } from "../setkit";
import { metal, book, TAU } from "./innerkit_b";
import { fitText } from "./portkit_common";
import type { SetDef, V3 } from "./types";

/** keep-out boxes (min, max), set-local: the camera must stay inside x -1.1..1.1, z -1.05..1.05, y 0.3..2.25 in the
 *  compartment, inside the corridor (z 1.3..2.15), or outside the window wall at z < -1.45 */
export const TRAIN_SOLIDS: [V3, V3][] = [
  [[-1.25, 0, -1.2], [-0.6, 1.4, 1.2]],    // bench A (seat + back + armrests)
  [[0.6, 0, -1.2], [1.25, 1.4, 1.2]],      // bench B
  [[-1.25, 1.78, -1.2], [-0.72, 2.2, 1.2]], // luggage rack A + cases
  [[0.72, 1.78, -1.2], [1.25, 2.2, 1.2]],  // luggage rack B
  [[-0.36, 0, -1.2], [0.36, 0.95, -0.8]],  // window table + tea things
  [[-0.2, 1.95, -0.2], [0.2, 2.6, 0.2]],   // swinging ceiling lamp
  [[-1.3, -1.2, -1.45], [1.3, 2.8, -1.1]], // window wall (outer face at z -1.4); outside: telegraph poles sweep along z -7.5
  [[-1.3, 0, 1.1], [1.3, 2.4, 1.2]],       // corridor partition + door
];

const XW = 1.2, ZW = -1.15, ZC = 1.15, ZO = 2.25, CH = 2.35, SPEED = 20;
const WX0 = -0.7, WX1 = 0.7, WY0 = 0.8, WY1 = 1.8;

// ---------------- painted textures ----------------
const panelTex = () => ctex("trPanel", 1024, 1024, (g, r) => {
  g.fillStyle = "#7a3422"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 70; i++) { g.strokeStyle = r() < 0.5 ? "rgba(40,12,8,0.25)" : "rgba(200,110,70,0.18)"; g.lineWidth = 2 + r() * 3; const y = r() * 1024; g.beginPath(); g.moveTo(0, y); for (let x = 0; x < 1024; x += 64) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 10); g.stroke(); }
  for (let px = 0; px < 1024; px += 512) for (let py = 0; py < 1024; py += 512) {
    g.fillStyle = "#8e4228"; g.fillRect(px + 30, py + 30, 452, 452);
    g.strokeStyle = "#e8b868"; g.lineWidth = 6; g.strokeRect(px + 46, py + 46, 420, 420); g.strokeStyle = "#3a140c"; g.lineWidth = 3; g.strokeRect(px + 58, py + 58, 396, 396);
    const cx = px + 256, cy = py + 256; g.fillStyle = "#e8b868"; g.beginPath(); g.moveTo(cx, cy - 70); g.lineTo(cx + 46, cy); g.lineTo(cx, cy + 70); g.lineTo(cx - 46, cy); g.closePath(); g.fill();
    g.fillStyle = "#5a2414"; g.beginPath(); g.moveTo(cx, cy - 44); g.lineTo(cx + 28, cy); g.lineTo(cx, cy + 44); g.lineTo(cx - 28, cy); g.closePath(); g.fill();
    for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { g.fillStyle = "#e8b868"; g.beginPath(); g.arc(cx + dx * 170, cy + dy * 170, 12, 0, TAU); g.fill(); }
  }
});
const velvetTex = () => ctex("trVelvet", 512, 512, (g, r) => {
  g.fillStyle = "#a81e2e"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 40; i++) { const x = r() * 512, y = r() * 512, rr = 30 + r() * 60; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, "rgba(255,120,120,0.12)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  g.strokeStyle = "rgba(60,0,10,0.45)"; g.lineWidth = 3;
  for (let k = -512; k < 1024; k += 64) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 512, 512); g.stroke(); g.beginPath(); g.moveTo(k + 512, 0); g.lineTo(k, 512); g.stroke(); }
  for (let y = 0; y <= 512; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x <= 512; x += 64) { g.fillStyle = "#e8b868"; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); g.fillStyle = "rgba(255,200,200,0.25)"; g.beginPath(); g.arc(x + 14, y, 16, 0, TAU); g.fill(); }
});
const carpetTex = () => ctex("trCarpet", 512, 512, (g) => {
  g.fillStyle = "#1f4a3e"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 128) for (let x = 0; x < 512; x += 128) { const o = ((y / 128) % 2) * 64; g.fillStyle = "#d9a84a"; g.beginPath(); g.moveTo(x + o + 64, y + 30); g.lineTo(x + o + 98, y + 64); g.lineTo(x + o + 64, y + 98); g.lineTo(x + o + 30, y + 64); g.closePath(); g.fill(); g.fillStyle = "#8a2a2a"; g.beginPath(); g.arc(x + o + 64, y + 64, 12, 0, TAU); g.fill(); }
});
const ceilTex = () => ctex("trCeil", 1024, 512, (g) => {
  g.fillStyle = "#efe0bc"; g.fillRect(0, 0, 1024, 512);
  g.strokeStyle = "#c99a46"; g.lineWidth = 8; g.strokeRect(40, 40, 944, 432); g.lineWidth = 3; g.strokeRect(64, 64, 896, 384);
  g.strokeStyle = "rgba(201,154,70,0.7)"; g.lineWidth = 4; for (const cx of [256, 768]) { g.beginPath(); g.ellipse(cx, 256, 150, 100, 0, 0, TAU); g.stroke(); for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; g.beginPath(); g.moveTo(cx + Math.cos(a) * 60, 256 + Math.sin(a) * 40); g.lineTo(cx + Math.cos(a) * 140, 256 + Math.sin(a) * 92); g.stroke(); } }
});
const exteriorTex = () => ctex("trExterior", 2048, 960, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 960); gr.addColorStop(0, "#2f4f8a"); gr.addColorStop(0.55, "#22407a"); gr.addColorStop(1, "#18305e"); g.fillStyle = gr; g.fillRect(0, 0, 2048, 960);
  const mx = (x: number) => ((x + 3.5) / 7) * 2048, my = (y: number) => ((2.7 - y) / 3.3) * 960;
  g.strokeStyle = "#e0b45a"; g.lineWidth = 6;
  for (const cx of [-2.4, 0, 2.4]) { g.strokeRect(mx(cx - 1.05), my(2.2), mx(cx + 1.05) - mx(cx - 1.05), my(0.62) - my(2.2)); g.lineWidth = 3; g.strokeRect(mx(cx - 0.98), my(0.42), mx(cx + 0.98) - mx(cx - 0.98), my(-0.45) - my(0.42)); g.lineWidth = 6; }
  for (const cx of [-2.4, 2.4]) { // neighbouring compartments: painted lit windows with drawn curtains
    const x0 = mx(cx - 0.7), x1 = mx(cx + 0.7), y0 = my(1.8), y1 = my(0.8); const wg = g.createLinearGradient(0, y0, 0, y1); wg.addColorStop(0, "#ffd98a"); wg.addColorStop(1, "#f2a85a"); g.fillStyle = wg; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    g.fillStyle = "#2f6a4a"; g.fillRect(x0, y0, (x1 - x0) * 0.22, y1 - y0); g.fillRect(x1 - (x1 - x0) * 0.22, y0, (x1 - x0) * 0.22, y1 - y0);
    g.strokeStyle = "#c99a46"; g.lineWidth = 10; g.strokeRect(x0, y0, x1 - x0, y1 - y0);
  }
  g.fillStyle = "#e0b45a"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "LIGNE DU SUD", mx(-2.4), my(0.0), mx(-1.6) - mx(-3.2), 64); fitText(g, "1re", mx(2.4), my(0.0), 200, 80);
  // invented crest (wheel + wings) under the middle window
  const cx = mx(0), cy = my(0.0); g.strokeStyle = "#e0b45a"; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, 44, 0, TAU); g.stroke(); for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 44, cy + Math.sin(a) * 44); g.stroke(); }
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 50, cy); g.quadraticCurveTo(cx + s * 110, cy - 50, cx + s * 170, cy - 20); g.quadraticCurveTo(cx + s * 110, cy - 10, cx + s * 50, cy + 12); g.fill(); }
  for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(255,255,255,0.05)"; g.fillRect(r() * 2048, r() * 960, 200, 4); }
  g.fillStyle = "#121a30"; g.fillRect(0, my(-0.5), 2048, 960 - my(-0.5));
  for (let x = 0; x < 2048; x += 24) { g.fillStyle = "#e0b45a"; g.beginPath(); g.arc(x + 12, my(-0.5) + 10, 3, 0, TAU); g.fill(); }
});
const posterTex = (key: string, title: string, top: string, bot: string, draw: (g: CanvasRenderingContext2D) => void) => ctex("trPoster" + key, 400, 300, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 300); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, 400, 300); draw(g);
  g.fillStyle = "#fbf3de"; g.fillRect(0, 238, 400, 62); g.fillStyle = "#2a1a22"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, title, 200, 270, 360, 40);
});
const fieldsTex = () => ctex("trFields", 1024, 1024, (g, r) => {
  const cols = ["#d9b24a", "#c9a03a", "#7aa04a", "#8c78c0", "#e2c46a", "#6a9a3e", "#b8903a"];
  for (let y = 0; y < 1024; y += 128) { let x = 0; while (x < 1024) { const w = 120 + r() * 260; g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x, y, w, 128); g.strokeStyle = "rgba(60,40,20,0.25)"; g.lineWidth = 2; for (let k = 8; k < 128; k += 12) { g.beginPath(); g.moveTo(x, y + k); g.lineTo(x + w, y + k); g.stroke(); } g.fillStyle = "#4f7a34"; g.fillRect(x + w - 6, y, 6, 128); x += w; } g.fillStyle = "#4f7a34"; g.fillRect(0, y, 1024, 5); }
});
const vergeTex = () => ctex("trVerge", 1024, 256, (g, r) => {
  g.fillStyle = "#8a7a5a"; g.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 3000; i++) { g.fillStyle = r() < 0.5 ? "rgba(60,50,40,0.5)" : "rgba(200,180,140,0.5)"; g.fillRect(r() * 1024, r() * 110, 3, 3); }
  g.fillStyle = "#6a8a3a"; g.fillRect(0, 110, 1024, 146);
  for (let i = 0; i < 900; i++) { g.strokeStyle = r() < 0.5 ? "rgba(140,170,70,0.8)" : "rgba(70,100,40,0.8)"; g.lineWidth = 2; const x = r() * 1024, y = 110 + r() * 146; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 8, y - 10 - r() * 12); g.stroke(); }
  g.fillStyle = "#5a4a3a"; for (let x = 0; x < 1024; x += 64) g.fillRect(x, 20, 30, 70); // sleepers of the next track
});
const hillTex = () => ctex("trHills", 2048, 256, (g, r) => {
  for (const [col, base, amp] of [["#b88a9a", 120, 70], ["#9a7a8e", 170, 50]] as const) {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, 256);
    for (let x = 0; x <= 2048; x += 16) g.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin(x * 0.006 + base) * Math.sin(x * 0.0021 + 1)) - 10 * r());
    g.lineTo(2048, 256); g.closePath(); g.fill();
  }
});

// ---------------- the set ----------------
export const train = (): SetDef => {
  const root = new THREE.Group(), car = new THREE.Group(); root.add(car);
  const b = new Batch(), r = rng(1925);
  const panel = lam("trPanelM", () => ({ map: panelTex() })), velvet = lam("trVelvetM", () => ({ map: velvetTex() }));
  const carpet = lam("trCarpetM", () => ({ map: carpetTex() })), ceil = lam("trCeilM", () => ({ map: ceilTex(), side: THREE.DoubleSide }));
  const wood = lam("trWood", () => ({ map: beamHD() })), darkWood = lam("trDarkWood", () => ({ color: "#4a1c12" }));
  const brass = metal("trBrass", "#d9a640", 70), cream = lam("trCream", () => ({ color: "#f2e6c8" }));
  const glassM = new THREE.MeshBasicMaterial({ color: "#cfe0ff", transparent: true, opacity: 0.1, depthWrite: false });
  const streak = (parent: THREE.Object3D, pos: V3, len: number, yaw = 0) => { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.05, len), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.2, depthWrite: false })); s.position.set(...pos); s.rotation.set(0, yaw, -0.6); s.layers.set(NOINK); parent.add(s); };

  // ================= shell: floor, end walls, window wall (inner + outer faces), corridor partition, ceilings ======
  b.add(quad(V(-XW, 0, ZC), V(XW, 0, ZC), V(XW, 0, ZW), V(-XW, 0, ZW), 2.4, 2.3), carpet);
  for (const s of [-1, 1]) b.add(boxGeo(V(s < 0 ? -XW - 0.1 : XW, 0, ZW), V(s < 0 ? -XW : XW + 0.1, CH + 0.3, ZC), 2), panel);
  // window wall: inner face (panelled), outer face (lacquered exterior) and the reveal sides
  const wallShape = (x0: number, x1: number, y0: number, y1: number) => {
    const sh = new THREE.Shape(); sh.moveTo(x0, y0); sh.lineTo(x1, y0); sh.lineTo(x1, y1); sh.lineTo(x0, y1); sh.closePath();
    const hole = new THREE.Path(), rr = 0.12; hole.moveTo(WX0 + rr, WY0); hole.lineTo(WX1 - rr, WY0); hole.quadraticCurveTo(WX1, WY0, WX1, WY0 + rr); hole.lineTo(WX1, WY1 - rr); hole.quadraticCurveTo(WX1, WY1, WX1 - rr, WY1); hole.lineTo(WX0 + rr, WY1); hole.quadraticCurveTo(WX0, WY1, WX0, WY1 - rr); hole.lineTo(WX0, WY0 + rr); hole.quadraticCurveTo(WX0, WY0, WX0 + rr, WY0);
    sh.holes.push(hole); return sh;
  };
  { const g = new THREE.ShapeGeometry(wallShape(-XW, XW, 0, CH + 0.3), 8); const uv = g.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 2); const m = new THREE.Mesh(g, panel); m.position.z = ZW; m.receiveShadow = true; car.add(m); }
  { const g = new THREE.ShapeGeometry(wallShape(-3.5, 3.5, -0.6, 2.7), 8); const uv = g.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + 3.5) / 7, (uv.getY(i) + 0.6) / 3.3);
    const m = new THREE.Mesh(g, lam("trExteriorM", () => ({ map: exteriorTex() }))); m.rotation.y = Math.PI; m.position.z = ZW - 0.25; car.add(m); }
  { // window reveal: a strip of quads round the hole outline, from the inner face to the outer face
    const pts = wallShape(-XW, XW, 0, CH).holes[0].getPoints(8), rv = new Batch(), rm = lam("trReveal", () => ({ color: "#5a2416", side: THREE.DoubleSide }));
    for (let i = 0; i < pts.length - 1; i++) { const a2 = pts[i], c2 = pts[i + 1]; rv.add(quad(V(a2.x, a2.y, ZW), V(c2.x, c2.y, ZW), V(c2.x, c2.y, ZW - 0.25), V(a2.x, a2.y, ZW - 0.25)), rm); }
    rv.build(car); }
  // roof + undercarriage seen from the outside camera
  { const roof = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 7, 32, 1, true, Math.PI / 2 - 0.62, 1.24).rotateZ(Math.PI / 2), lam("trRoof", () => ({ color: "#5a6070", side: THREE.DoubleSide }))); roof.position.set(0, -0.2, 0.55); car.add(roof); }
  b.add(boxGeo(V(-3.5, -1.0, ZW - 0.3), V(3.5, -0.6, ZO + 0.2)), lam("trUnder", () => ({ color: "#1a1e2a" })));
  // ceiling: shallow arch across the compartment
  const sag = 0.25;
  for (let i = 0; i < 12; i++) { const z0 = ZW + ((ZC - ZW) * i) / 12, z1 = ZW + ((ZC - ZW) * (i + 1)) / 12, y = (z: number) => CH + sag * (1 - ((2 * (z - (ZW + ZC) / 2)) / (ZC - ZW)) ** 2); b.add(quad(V(-XW, y(z0), z0), V(XW, y(z0), z0), V(XW, y(z1), z1), V(-XW, y(z1), z1), 1, 1 / 12, 0, i / 12), ceil); }
  for (const s of [-1, 1]) b.add(boxGeo(V(-XW, CH - 0.08, s < 0 ? ZW : ZC - 0.08), V(XW, CH, s < 0 ? ZW + 0.08 : ZC)), wood); // cornices
  // corridor partition: panelled wall with a door opening + two glazed lights, glass, door
  const part = (x0: number, x1: number, y0: number, y1: number) => b.add(boxGeo(V(x0, y0, ZC), V(x1, y1, ZC + 0.08), 2), panel);
  part(-XW, -1.1, 0, CH); part(-0.55, -0.42, 0, CH); part(0.42, 0.55, 0, CH); part(1.1, XW, 0, CH); part(-1.1, -0.55, 0, 0.95); part(0.55, 1.1, 0, 0.95); part(-1.1, -0.55, 1.95, CH); part(0.55, 1.1, 1.95, CH); part(-0.42, 0.42, 2.08, CH);
  for (const x of [-0.825, 0.825]) { const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.0), glassM); gl.position.set(x, 1.45, ZC + 0.04); gl.layers.set(NOINK); car.add(gl); streak(car, [x - 0.12, 1.55, ZC + 0.03], 0.5); b.add(boxGeo(V(x - 0.3, 0.92, ZC - 0.03), V(x + 0.3, 0.97, ZC + 0.11)), brass); }
  // half-drawn curtains on the corridor lights
  for (const x of [-1.03, 1.03]) { const c = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 1.0, 1, 6), lam("trCurtain", () => ({ color: "#2f6a4a", side: THREE.DoubleSide }))); c.position.set(x, 1.45, ZC - 0.02); car.add(c); }
  // the sliding door: wood frame + glass + brass handle (ctl door slides it toward +x)
  const doorG = new THREE.Group(); car.add(doorG);
  { const dB = new Batch(); for (const [x0, y0, x1, y1] of [[-0.42, 0, 0.42, 0.85], [-0.42, 1.9, 0.42, 2.08], [-0.42, 0.85, -0.32, 1.9], [0.32, 0.85, 0.42, 1.9]]) dB.add(boxGeo(V(x0, y0, -0.02), V(x1, y1, 0.02)), panel); dB.add(boxGeo(V(-0.32, 0.82, -0.025), V(0.32, 0.87, 0.025)), brass); dB.build(doorG);
    const dg = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 1.05), glassM); dg.position.y = 1.375; dg.layers.set(NOINK); doorG.add(dg); streak(doorG, [-0.12, 1.45, -0.025], 0.6);
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.04), brass); h.position.set(-0.36, 1.1, -0.04); doorG.add(h);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.08), new THREE.MeshBasicMaterial({ map: ctex("trDoorPlate", 256, 96, (g) => { g.fillStyle = "#e0b45a"; g.fillRect(0, 0, 256, 96); g.fillStyle = "#3a1a10"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "1re CLASSE", 128, 50, 230, 44); }) })); plate.position.set(0, 1.98, -0.025); plate.rotation.y = Math.PI; doorG.add(plate); }
  // corridor: floor runner, outer wall with windows, handrail, flat ceiling + lamps
  b.add(quad(V(-4, 0, ZO), V(4, 0, ZO), V(4, 0, ZC + 0.08), V(-4, 0, ZC + 0.08), 8, 1), carpet);
  b.add(boxGeo(V(-4, 0, ZC + 0.08), V(-XW - 0.1, CH, ZC + 0.16), 2), panel); b.add(boxGeo(V(XW + 0.1, 0, ZC + 0.08), V(4, CH, ZC + 0.16), 2), panel);
  b.add(quad(V(-4, CH, ZC + 0.08), V(4, CH, ZC + 0.08), V(4, CH, ZO), V(-4, CH, ZO), 4, 1), ceil);
  for (const [x0, x1, y0, y1] of [[-4, 4, 0, 0.95], [-4, 4, 1.85, CH], [-4, -3.3, 0.95, 1.85], [-1.9, -0.75, 0.95, 1.85], [0.75, 1.9, 0.95, 1.85], [3.3, 4, 0.95, 1.85]]) b.add(boxGeo(V(x0, y0, ZO), V(x1, y1, ZO + 0.08), 2), panel);
  for (const x of [-2.6, 0, 2.6]) { const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), glassM); gl.position.set(x, 1.4, ZO + 0.02); gl.rotation.y = Math.PI; gl.layers.set(NOINK); car.add(gl); }
  rod(car, [-4, 1.0, ZO - 0.08], [4, 1.0, ZO - 0.08], 0.018, brass);
  const corrLamps = [-2.4, 2.4].map((x) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10, 0, TAU, 0, Math.PI / 2).rotateX(Math.PI), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffe2a0").multiplyScalar(1.8) })); m.position.set(x, CH - 0.02, (ZC + ZO) / 2); m.layers.set(NOINK); car.add(m); const L = new THREE.PointLight("#ffc880", 2.5, 4, 1.4); L.position.set(x, CH - 0.2, (ZC + ZO) / 2); car.add(L); return glow(car, [x, CH - 0.1, (ZC + ZO) / 2], "#ffcf88", 0.8, 0.7); });

  // ================= the window: brass frame, glass, drop-sash strap, blind, curtains =================
  for (const [x0, y0, x1, y1] of [[WX0 - 0.06, WY0 - 0.06, WX1 + 0.06, WY0], [WX0 - 0.06, WY1, WX1 + 0.06, WY1 + 0.06], [WX0 - 0.06, WY0, WX0, WY1], [WX1, WY0, WX1 + 0.06, WY1]]) b.add(boxGeo(V(x0, y0, ZW), V(x1, y1, ZW + 0.04)), brass);
  b.add(boxGeo(V(WX0 - 0.08, WY0 - 0.1, ZW), V(WX1 + 0.08, WY0 - 0.04, ZW + 0.12)), wood); // sill
  b.add(boxGeo(V(WX0, WY0 + 0.42, ZW - 0.1), V(WX1, WY0 + 0.46, ZW - 0.07)), brass); // sash rail
  const wg = new THREE.Mesh(new THREE.PlaneGeometry(WX1 - WX0, WY1 - WY0), glassM); wg.position.set(0, (WY0 + WY1) / 2, ZW - 0.12); wg.layers.set(NOINK); car.add(wg);
  streak(car, [-0.35, 1.4, ZW - 0.11], 0.6); streak(car, [-0.22, 1.5, ZW - 0.11], 0.3);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.01), lam("trStrap", () => ({ color: "#5a2a16" }))); strap.position.set(0, WY0 + 0.25, ZW - 0.06); car.add(strap);
  b.add(new THREE.CylinderGeometry(0.035, 0.035, WX1 - WX0 + 0.1, 12).rotateZ(Math.PI / 2).translate(0, WY1 + 0.02, ZW + 0.06), cream); // rolled blind
  const blindCord = new THREE.Group(); blindCord.position.set(0.0, WY1 + 0.02, ZW + 0.09); car.add(blindCord);
  { const cm = lam("trCord", () => ({ color: "#d9a640" })); const cd = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.22, 4).translate(0, -0.11, 0), cm); blindCord.add(cd); const ts = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 8).translate(0, -0.25, 0), cm); blindCord.add(ts); }
  const curtains: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const geo = new THREE.PlaneGeometry(0.32, 1.25, 8, 10); const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), t = (0.625 - y) / 1.25; p.setX(i, x * (1 - 0.4 * Math.sin(Math.min(1, t * 1.8) * Math.PI / 2) * (t < 0.6 ? 1 : 0.8))); p.setZ(i, 0.04 * Math.sin((x / 0.32) * Math.PI * 4)); }
    geo.computeVertexNormals(); geo.translate(0, -0.625, 0);
    const c = new THREE.Mesh(geo, lam("trCurtainM", () => ({ map: ctex("trCurtainT", 128, 256, (g) => { g.fillStyle = "#2f6a4a"; g.fillRect(0, 0, 128, 256); for (let x = 0; x < 128; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, "rgba(200,255,220,0.15)"); gr.addColorStop(1, "rgba(0,30,10,0.3)"); g.fillStyle = gr; g.fillRect(x, 0, 16, 256); } g.fillStyle = "#e0b45a"; g.fillRect(0, 236, 128, 12); }), side: THREE.DoubleSide })));
    c.position.set(s * (WX1 + 0.12), WY1 + 0.12, ZW + 0.08); c.castShadow = true; car.add(c); curtains.push(c);
    const tb = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 14), brass); tb.position.set(s * (WX1 + 0.13), WY0 + 0.45, ZW + 0.1); car.add(tb);
  }
  rod(car, [WX0 - 0.35, WY1 + 0.14, ZW + 0.08], [WX1 + 0.35, WY1 + 0.14, ZW + 0.08], 0.015, brass);

  // ================= benches (A: -x, Lustig; B: +x), armrests, headrest lace, luggage racks, posters, mirror ========
  const SEATY = 0.48, SEATX = 0.62;
  for (const s of [-1, 1]) {
    const xe = s * XW, xf = s * SEATX, xb = s * 1.02;
    b.add(boxGeo(V(Math.min(xe, xf), 0, ZW + 0.02), V(Math.max(xe, xf), 0.3, ZC - 0.04)), darkWood);
    const cush = new RoundedBoxGeometry(Math.abs(xe - xf) - 0.02, 0.18, ZC - ZW - 0.1, 3, 0.06); cush.translate((xe + xf) / 2, 0.39, (ZW + ZC) / 2 - 0.01); b.add(cush, velvet);
    const back = new RoundedBoxGeometry(0.16, 0.86, ZC - ZW - 0.1, 3, 0.06); back.rotateZ(-s * 0.08); back.translate(s * 1.1, SEATY + 0.42, (ZW + ZC) / 2 - 0.01); b.add(back, velvet);
    b.add(boxGeo(V(Math.min(xe, s * 1.0), SEATY + 0.82, ZW + 0.02), V(Math.max(xe, s * 1.0), SEATY + 0.88, ZC - 0.04)), wood); // top rail
    for (const z of [-0.37, 0.39]) { const ar = new RoundedBoxGeometry(Math.abs(xb - xf) - 0.04, 0.08, 0.1, 2, 0.03); ar.translate((xb + xf) / 2, SEATY + 0.2, z); b.add(ar, velvet); b.add(new THREE.BoxGeometry(0.06, 0.2, 0.08).translate(xf - s * 0.05, SEATY + 0.09, z), wood); }
    for (const z of [-0.76, 0.0, 0.76]) { const lace = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.22), lam("trLace", () => ({ map: ctex("trLaceT", 128, 96, (g) => { g.fillStyle = "#fbf6ea"; g.fillRect(0, 0, 128, 84); for (let x = 0; x < 128; x += 16) { g.beginPath(); g.arc(x + 8, 84, 8, 0, Math.PI); g.fill(); } g.strokeStyle = "rgba(180,160,120,0.6)"; g.lineWidth = 2; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(64, 42, 8 + k * 7, 0, TAU); g.stroke(); } }), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }))); lace.position.set(s * 1.015, SEATY + 0.68, z); lace.rotation.set(0, -s * Math.PI / 2, s * 0.08); car.add(lace); }
    // luggage rack: brass rails + net, brackets
    const ry = 1.88;
    for (const z of [ZW + 0.1, -0.2, 0.6, ZC - 0.1]) rod(car, [xe, ry + 0.12, z], [s * 0.78, ry, z], 0.012, brass);
    for (const x of [s * 0.8, s * 0.98]) rod(car, [x, ry + (x === s * 0.8 ? 0 : 0.04), ZW + 0.05], [x, ry + (x === s * 0.8 ? 0 : 0.04), ZC - 0.05], 0.014, brass);
    const net = new THREE.Mesh(new THREE.PlaneGeometry(0.4, ZC - ZW - 0.1).rotateX(-Math.PI / 2), lam("trNet", () => ({ map: rep(ctex("trNetT", 128, 128, (g) => { g.strokeStyle = "#c9a96e"; g.lineWidth = 6; for (let k = -128; k < 256; k += 24) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 128, 128); g.stroke(); g.beginPath(); g.moveTo(k + 128, 0); g.lineTo(k, 128); g.stroke(); } }), 2, 12), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide })));
    net.position.set(s * 0.98, ry + 0.01, (ZW + ZC) / 2); car.add(net);
    // posters + a bevelled mirror between them, above the seat back
    const py = 1.55;
    const p1 = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.34), lam("trPosterM" + s, () => ({ map: s < 0
      ? posterTex("azur", "CÔTE D'AZUR", "#ffb46a", "#3ab0c8", (g) => { g.fillStyle = "#f2e2a0"; g.beginPath(); g.arc(300, 90, 40, 0, TAU); g.fill(); g.fillStyle = "#2a7aa0"; g.fillRect(0, 150, 400, 90); g.fillStyle = "#3a6a2a"; g.fillRect(60, 80, 10, 120); for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(65, 80, 50, 12, (k / 5) * Math.PI, 0, TAU); g.fill(); } g.fillStyle = "#fbf3de"; g.beginPath(); g.moveTo(220, 190); g.lineTo(260, 120); g.lineTo(260, 190); g.fill(); })
      : posterTex("alpes", "LES ALPES", "#8ac0f0", "#f2e6d0", (g) => { g.fillStyle = "#6a7aa8"; g.beginPath(); g.moveTo(0, 238); g.lineTo(120, 80); g.lineTo(200, 160); g.lineTo(290, 50); g.lineTo(400, 238); g.fill(); g.fillStyle = "#fbfbff"; g.beginPath(); g.moveTo(98, 108); g.lineTo(120, 80); g.lineTo(142, 108); g.fill(); g.beginPath(); g.moveTo(262, 88); g.lineTo(290, 50); g.lineTo(318, 88); g.fill(); g.fillStyle = "#3a7a3a"; g.fillRect(0, 210, 400, 28); }) })));
    p1.position.set(s * 1.195, py, -0.62); p1.rotation.y = -s * Math.PI / 2; car.add(p1);
    const p2 = p1.clone(); p2.position.z = 0.66; car.add(p2);
    const mir = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), metal("trMirror", "#c8d6f0", 120)); mir.position.set(s * 1.193, py, 0.02); mir.rotation.y = -s * Math.PI / 2; car.add(mir);
    for (const z of [-0.62, 0.02, 0.66]) { const fr = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.4, 0.52), brass); fr.position.set(s * 1.2, py, z); car.add(fr); }
    // coat hook + a hung scarf near the corridor
    b.add(new THREE.SphereGeometry(0.025, 8, 6).translate(s * 1.18, 1.62, ZC - 0.2), brass);
  }
  // ---- luggage on the racks: suitcases, a hatbox, a rolled umbrella; a coat + hat on B's hook ----
  const leather = lam("trLeather", () => ({ map: ctex("trLeatherT", 256, 256, (g, rr) => { g.fillStyle = "#8a4a26"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 400; i++) { g.fillStyle = rr() < 0.5 ? "rgba(60,30,10,0.2)" : "rgba(200,140,90,0.15)"; g.fillRect(rr() * 256, rr() * 256, 3, 3); } g.fillStyle = "#5a2a12"; g.fillRect(0, 100, 256, 18); g.fillRect(0, 150, 256, 18); }) }));
  const rackCase = (x: number, z: number, w: number, h: number, d: number, m: THREE.Material) => { const c = new RoundedBoxGeometry(w, h, d, 2, 0.03); c.translate(x, 1.89 + h / 2, z); b.add(c, m); };
  rackCase(-0.98, -0.55, 0.36, 0.2, 0.62, leather); rackCase(-0.98, 0.25, 0.32, 0.16, 0.5, lam("trCaseB", () => ({ color: "#2f4a6a" }))); rackCase(0.98, -0.3, 0.36, 0.22, 0.7, leather);
  { const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.22, 20), lam("trHatbox", () => ({ map: ctex("trHatboxT", 256, 64, (g) => { g.fillStyle = "#f2d2d8"; g.fillRect(0, 0, 256, 64); g.fillStyle = "#c0476a"; for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 14, 64); }) }))); hb.position.set(0.98, 2.0, 0.55); car.add(hb); }
  { const coat = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.6, 4, 10).scale(0.45, 1, 1), lam("trCoat", () => ({ color: "#4a5a7a" }))); coat.position.set(1.12, 1.25, ZC - 0.2); car.add(coat); }
  // ================= the window table: cup + saucer, vase with a rose, folded newspaper, ashtray =================
  b.add(boxGeo(V(-0.32, 0.68, ZW + 0.01), V(0.32, 0.72, ZW + 0.34)), wood);
  b.add(boxGeo(V(-0.33, 0.66, ZW + 0.33), V(0.33, 0.72, ZW + 0.36)), brass);
  rod(car, [0, 0.66, ZW + 0.3], [0, 0.32, ZW + 0.02], 0.015, brass);
  { const china = lam("trChina", () => ({ color: "#f8f4ea" })); b.add(new THREE.CylinderGeometry(0.07, 0.06, 0.012, 18).translate(0.14, 0.726, ZW + 0.2), china); b.add(new THREE.CylinderGeometry(0.04, 0.032, 0.06, 16).translate(0.14, 0.762, ZW + 0.2), china); b.add(new THREE.TorusGeometry(0.018, 0.005, 6, 10).translate(0.18, 0.765, ZW + 0.2), china);
    b.add(new THREE.CylinderGeometry(0.036, 0.036, 0.004, 14).translate(0.14, 0.79, ZW + 0.2), lam("trTea", () => ({ color: "#8a4a1a" })));
    b.add(new THREE.CylinderGeometry(0.022, 0.03, 0.14, 12).translate(-0.18, 0.79, ZW + 0.1), metal("trVase", "#c9e0f0", 100)); rod(car, [-0.18, 0.8, ZW + 0.1], [-0.17, 0.95, ZW + 0.1], 0.004, lam("trStem", () => ({ color: "#3a7a3a" })));
    const rose = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), lam("trRose", () => ({ color: "#d8203a" }))); rose.position.set(-0.17, 0.96, ZW + 0.1); car.add(rose);
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.012, 0.27), lam("trNews", () => ({ map: ctex("trNewsT", 256, 340, (g) => { g.fillStyle = "#ece2c8"; g.fillRect(0, 0, 256, 340); g.fillStyle = "#2a2226"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "LE CRIEUR", 128, 30, 220, 34); g.fillRect(14, 52, 228, 3); fitText(g, "LA TOUR À VENDRE ?", 128, 84, 224, 26); g.fillStyle = "rgba(40,30,30,0.5)"; for (let i = 0; i < 14; i++) g.fillRect(14, 112 + i * 14, 228, 5); }) })));
    paper.position.set(-0.04, 0.728, ZW + 0.24); paper.rotation.y = 0.35; car.add(paper);
    b.add(new THREE.CylinderGeometry(0.05, 0.045, 0.02, 14).translate(0.24, 0.73, ZW + 0.08), brass); }
  book(car, [0.8, SEATY, 0.75], 0.18, 0.04, 0.24, "#2f5d9a", 0.4);

  // ================= Lustig's leather suitcase on bench A's middle seat (lid opens) =================
  const CSX = -0.78, CSZ = 0.0, CW = 0.38, CL = 0.62, CHh = 0.18;
  const caseG = new THREE.Group(); caseG.position.set(CSX, SEATY + 0.0, CSZ); car.add(caseG);
  const caseLeather = lam("trCaseLeather", () => ({ color: "#6a3418" })), lining = lam("trLining", () => ({ color: "#8a1a2a" })), strapM = lam("trCaseStrap", () => ({ color: "#3a1a0a" }));
  { const cb = new Batch(); const T = 0.025;
    cb.add(boxGeo(V(-CW / 2, 0, -CL / 2), V(CW / 2, T, CL / 2)), caseLeather);
    cb.add(boxGeo(V(-CW / 2, 0, -CL / 2), V(CW / 2, CHh * 0.62, -CL / 2 + T)), caseLeather); cb.add(boxGeo(V(-CW / 2, 0, CL / 2 - T), V(CW / 2, CHh * 0.62, CL / 2)), caseLeather);
    cb.add(boxGeo(V(-CW / 2, 0, -CL / 2), V(-CW / 2 + T, CHh * 0.62, CL / 2)), caseLeather); cb.add(boxGeo(V(CW / 2 - T, 0, -CL / 2), V(CW / 2, CHh * 0.62, CL / 2)), caseLeather);
    cb.add(boxGeo(V(-CW / 2 + T, T, -CL / 2 + T), V(CW / 2 - T, T + 0.004, CL / 2 - T)), lining);
    for (const z of [-0.17, 0.17]) cb.add(boxGeo(V(-CW / 2 - 0.004, 0, z - 0.025), V(CW / 2 + 0.004, CHh * 0.62 + 0.002, z + 0.025)), strapM);
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cb.add(new THREE.SphereGeometry(0.022, 8, 6).translate(x * CW / 2, 0.03, z * CL / 2), brass);
    cb.build(caseG);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.014, 6, 12, Math.PI), strapM); handle.position.set(CW / 2 + 0.01, CHh * 0.4, 0); handle.rotation.set(0, Math.PI / 2, Math.PI / 2); caseG.add(handle);
    for (const z of [-0.17, 0.17]) { const cl = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.04), brass); cl.position.set(CW / 2 + 0.008, CHh * 0.6, z); caseG.add(cl); } }
  const lidG = new THREE.Group(); lidG.position.set(-CW / 2, CHh * 0.62, 0); caseG.add(lidG); // hinge along the back (seat-back side)
  { const lb = new Batch(), T = 0.025, LH = CHh * 0.38;
    lb.add(boxGeo(V(0, LH - T, -CL / 2), V(CW, LH, CL / 2)), caseLeather);
    lb.add(boxGeo(V(0, 0, -CL / 2), V(CW, LH, -CL / 2 + T)), caseLeather); lb.add(boxGeo(V(0, 0, CL / 2 - T), V(CW, LH, CL / 2)), caseLeather);
    lb.add(boxGeo(V(0, 0, -CL / 2), V(T, LH, CL / 2)), caseLeather); lb.add(boxGeo(V(CW - T, 0, -CL / 2), V(CW, LH, CL / 2)), caseLeather);
    lb.add(boxGeo(V(T, LH - T - 0.004, -CL / 2 + T), V(CW - T, LH - T, CL / 2 - T), 0, true), lining);
    for (const z of [-0.17, 0.17]) lb.add(boxGeo(V(-0.004, 0, z - 0.025), V(CW + 0.004, LH + 0.003, z + 0.025)), strapM);
    lb.build(lidG);
    const tagC = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.06).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: ctex("trCaseTag", 128, 80, (g) => { g.fillStyle = "#f2e2b0"; g.fillRect(0, 0, 128, 80); g.fillStyle = "#3a1a10"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "V. L.", 64, 42, 100, 40); }) })); tagC.position.set(CW * 0.55, LH + 0.003, -0.1); tagC.rotation.y = 0.3; lidG.add(tagC); }

  // ================= lamps: swinging ceiling tulip + twin sconces; golden window light (pole flicker) =================
  const pend = new THREE.Group(); pend.position.set(0, CH + sag - 0.02, 0); car.add(pend);
  rod(pend, [0, 0, 0], [0, -0.32, 0], 0.008, brass);
  { const cup = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 10, 0, TAU, 0, Math.PI * 0.55), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffe6b0").multiplyScalar(1.7), side: THREE.DoubleSide })); cup.rotation.x = Math.PI; cup.position.y = -0.36; cup.layers.set(NOINK); pend.add(cup);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.012, 6, 24).rotateX(Math.PI / 2), brass); rim.position.y = -0.37; pend.add(rim);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.06, 14), brass); cap.position.y = -0.33; pend.add(cap); }
  const pendL = new THREE.PointLight("#ffc87a", 5, 5, 1.3); pendL.position.y = -0.45; pend.add(pendL);
  const pendGlow = glow(pend, [0, -0.42, 0], "#ffd090", 1.1, 0.8);
  const sconces = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * 1.18, 1.75, -0.32); car.add(g);
    b.add(new THREE.BoxGeometry(0.04, 0.12, 0.12).translate(s * 1.18, 1.75, -0.32), brass);
    const tulip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 14, 1, true).rotateX(Math.PI), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffe6b0").multiplyScalar(1.6), side: THREE.DoubleSide })); tulip.position.set(-s * 0.1, 0.02, 0); tulip.layers.set(NOINK); g.add(tulip);
    rod(g, [0, 0, 0], [-s * 0.1, 0.08, 0], 0.008, brass);
    const L = new THREE.PointLight("#ffbe70", 2.2, 3, 1.4); L.position.set(-s * 0.15, 0, 0); g.add(L);
    return { L, gl: glow(g, [-s * 0.1, 0.0, 0], "#ffcf88", 0.6, 0.8) }; });
  const sunL = new THREE.SpotLight("#ffb86a", 14, 7, 0.55, 0.6, 1.1); sunL.position.set(0.9, 1.9, ZW - 1.4); sunL.target.position.set(-0.6, 0.6, 0.3); car.add(sunL, sunL.target);
  const sunShaft = shaft(car, [0.15, 1.5, ZW - 0.1], [-0.55, 0.35, 0.5], 1.1, "#ffc070", 0.12);
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.7).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: ctex("trSunPatch", 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 20, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }), color: "#ffb860", transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
  patch.position.set(-0.45, 0.012, 0.15); patch.rotation.y = 0.5; patch.layers.set(NOINK); car.add(patch);
  b.build(car);

  // ================= the countryside (both sides), scrolling along -x with time =================
  const scen = new THREE.Group(); root.add(scen);
  const movers: { o: THREE.Object3D; x0: number; wrap: number }[] = [];
  const mover = (o: THREE.Object3D, x0: number, wrap: number) => { scen.add(o); movers.push({ o, x0, wrap }); return o; };
  const poleXs: number[] = [];
  const GY = -1.15; // ground below the floor
  const sides: [number, (z: number) => number][] = [[-1, (z) => z], [1, (z) => ZO + (-z - 1.15) + 0.1]];
  const scrolled: THREE.Texture[] = [];
  const poleWood = lam("trPoleWood", () => ({ color: "#5a3a26" })), wireM = lam("trWire", () => ({ color: "#2a2430" })), insul = lam("trInsul", () => ({ color: "#d8eaf0" }));
  const leafA = lam("trLeafA", () => ({ color: "#4f8a3a" })), leafB = lam("trLeafB", () => ({ color: "#6a9a3e" })), poplarM = lam("trPoplar", () => ({ color: "#3f7a3a" })), hay = lam("trHay", () => ({ color: "#e2b44a" }));
  for (const [sd, Z] of sides) {
    // ground: ballast + verge strip (fast) and the fields (texture scroll at the train speed)
    const vt = vergeTex().clone(); vt.wrapS = vt.wrapT = THREE.RepeatWrapping; vt.repeat.set(30, 1); vt.needsUpdate = true; scrolled.push(vt);
    const verge = new THREE.Mesh(new THREE.PlaneGeometry(120, 8).rotateX(-Math.PI / 2), lam("trVergeM" + sd, () => ({ map: vt }))); verge.position.set(0, GY, Z(-5.5)); scen.add(verge); verge.userData.tile = 120 / 30;
    const ft = fieldsTex().clone(); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(16, 8); ft.needsUpdate = true; scrolled.push(ft);
    const fields = new THREE.Mesh(new THREE.PlaneGeometry(800, 400).rotateX(-Math.PI / 2), lam("trFieldsM" + sd, () => ({ map: ft }))); fields.position.set(0, GY - 0.02, Z(-209)); scen.add(fields); fields.userData.tile = 800 / 16;
    verge.userData.sc = vt; fields.userData.sc = ft;
    // telegraph poles + sagging wires (window side only for the near flick; far side further out)
    const PZ = sd < 0 ? -7.5 : Z(-6.0), SP = 9, NP = 10;
    for (let i = 0; i < NP; i++) {
      const g = new THREE.Group(); const x0 = i * SP;
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 7.2, 8).translate(0, GY + 3.6, 0), poleWood));
      for (const y of [GY + 6.6, GY + 6.1]) { g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 1.2).translate(0, y, 0), poleWood)); for (const z of [-0.5, -0.2, 0.2, 0.5]) g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.1, 8).translate(0, y + 0.08, z), insul)); }
      for (const [y, z] of [[GY + 6.75, -0.5], [GY + 6.75, 0.5], [GY + 6.25, -0.2], [GY + 6.25, 0.2]] as const) { // wire to the next pole (catenary)
        const pts = Array.from({ length: 9 }, (_, k) => V(-(k / 8) * SP, y - 0.45 * Math.sin((k / 8) * Math.PI), z));
        g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.012, 4), wireM));
      }
      g.position.z = PZ; g.traverse((o) => { (o as THREE.Mesh).castShadow = false; });
      mover(g, x0, SP * NP); if (sd < 0) poleXs.push(movers.length - 1);
    }
    // hedges, poplars, haystacks, farmhouses
    for (let i = 0; i < 12; i++) { const g = new THREE.Group(); const L = 3 + r() * 6; const hb = new Batch(); for (let k = 0; k < Math.ceil(L / 0.9); k++) hb.add(new THREE.SphereGeometry(0.75 + r() * 0.3, 10, 8).scale(1, 0.85, 0.9).translate(k * 0.9 - L / 2, GY + 0.6, 0), k % 2 ? leafA : leafB); hb.build(g, false); g.position.z = Z(-9 - r() * 12); mover(g, r() * 140, 140); }
    for (let i = 0; i < 16; i++) { const g = new THREE.Group(); const h = 7 + r() * 5; g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, h * 0.3, 6).translate(0, GY + h * 0.15, 0), poleWood)); const crown = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), poplarM); crown.scale.set(0.9, h * 0.42, 0.9); crown.position.y = GY + h * 0.58; g.add(crown); g.position.z = Z(-14 - r() * 18); mover(g, (i % 8) * 6 + (i >= 8 ? 90 : 0) + r() * 3, 180); }
    for (let i = 0; i < 7; i++) { const g = new THREE.Group(); const hs = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 1.3, 14).translate(0, GY + 0.65, 0), hay); g.add(hs); const top = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8, 0, TAU, 0, Math.PI / 2).translate(0, GY + 1.3, 0), hay); top.scale.y = 0.6; g.add(top); g.position.z = Z(-18 - r() * 16); mover(g, r() * 160, 160); }
    for (let i = 0; i < 2; i++) { const g = new THREE.Group(); const fb = new Batch(); fb.add(boxGeo(V(-4, GY, -2.5), V(4, GY + 4, 2.5)), lam("trFarmWall", () => ({ color: "#efd9b0" }))); const roofG = new THREE.CylinderGeometry(3.2, 3.2, 8.6, 3, 1).rotateZ(Math.PI / 2).scale(1, 0.55, 0.95).translate(0, GY + 5.3, 0); fb.add(roofG, lam("trFarmRoof", () => ({ color: "#c0603a" }))); fb.add(boxGeo(V(-1.5, GY + 1.6, 2.5), V(-0.6, GY + 2.6, 2.55)), lam("trFarmWin", () => ({ color: "#3a4a6a" }))); fb.add(boxGeo(V(1.0, GY, 2.5), V(2.0, GY + 2.2, 2.55)), lam("trFarmDoor", () => ({ color: "#6a3a26" }))); fb.build(g, false); g.position.z = Z(-42 - i * 20); g.rotation.y = sd < 0 ? 0 : Math.PI; mover(g, i * 130 + 40, 260); }
    // far hills: two long painted cards that wrap
    for (let k = 0; k < 2; k++) { const hm = new THREE.Mesh(new THREE.PlaneGeometry(400, 50), new THREE.MeshBasicMaterial({ map: hillTex(), transparent: true, alphaTest: 0.05, fog: true })); hm.geometry.translate(0, 25 + GY - 3, 0); hm.position.z = Z(-190); if (sd > 0) hm.rotation.y = Math.PI; mover(hm, k * 400, 800); }
  }

  // ================= marks + cams =================
  const marks: Record<string, V3> = {
    lustigSit: [-0.84, 0.36, -0.78], lustigStand: [0.02, 0, 0.1], passenger: [0.84, 0.36, -0.78], passenger2: [0.84, 0.36, 0.75],
    corridorA: [-3.0, 0, 1.72], corridorB: [3.0, 0, 1.72], doorway: [0.0, 0, 1.4], suitcase: [CSX, SEATY + CHh, CSZ], window: [0, 1.3, ZW],
  };
  const cams = {
    wide: { pos: [0.5, 2.1, 0.98] as V3, look: [-0.45, 0.88, -0.85] as V3, fov: 45 },
    medium: { pos: [0.5, 1.22, -0.2] as V3, look: [-0.84, 1.02, -0.78] as V3, fov: 40 },
    two: { pos: [0.05, 1.45, 2.12] as V3, look: [0.0, 1.0, -1.0] as V3, fov: 45 }, // through the open door (ctl door 1): both seated at the frame edges, window between them
    low: { pos: [0.4, 0.42, 0.7] as V3, look: [-0.75, 1.3, -0.8] as V3, fov: 44 },
    high: { pos: [0.55, 2.2, 0.75] as V3, look: [-0.72, 0.45, -0.25] as V3, fov: 42 },
    outside: { pos: [0.3, 1.45, -6.3] as V3, look: [0.0, 1.2, 0.5] as V3, fov: 42 },
    corridor: { pos: [-0.1, 1.5, -0.6] as V3, look: [0.0, 1.35, 2.25] as V3, fov: 42 },
    case: { pos: [-0.2, 1.4, 0.75] as V3, look: [-0.85, 0.62, -0.05] as V3, fov: 38 },
  };
  const cl01 = (x: number) => Math.max(0, Math.min(1, x));
  return {
    name: "train", root, marks, cams,
    pose: (t, c) => {
      // the carriage rocks: slow roll + a rail-joint bob every ~0.9 s, plus the story lean
      const lean = Math.max(-1, Math.min(1, c.lean ?? 0));
      car.rotation.x = 0.0045 * Math.sin(t * 1.7) + 0.002 * Math.sin(t * 4.3) + 0.03 * lean;
      const ph = (t * 1.1) % 1; car.position.y = 0.006 * Math.exp(-ph * 9) * Math.sin(ph * 40) + 0.002 * Math.sin(t * 7);
      pend.rotation.x = 0.07 * Math.sin(t * 1.7 - 0.6) + 0.12 * lean; pend.rotation.z = 0.03 * Math.sin(t * 1.3);
      blindCord.rotation.x = 0.15 * Math.sin(t * 1.7 - 0.9); blindCord.rotation.z = 0.08 * Math.sin(t * 2.3);
      curtains.forEach((cu, i) => { cu.rotation.x = 0.03 * Math.sin(t * 1.7 + i) + 0.04 * lean; });
      // scenery scrolls
      for (const m of movers) { const x = ((((m.x0 - t * SPEED) % m.wrap) + m.wrap * 1.5) % m.wrap) - m.wrap / 2; m.o.position.x = x; }
      scen.children.forEach((o) => { const u = o.userData; if (u.sc) (u.sc as THREE.Texture).offset.x = (t * SPEED) / u.tile; });
      // window light dims as a pole sweeps past the glass
      let sh = 0; for (const i of poleXs) { const x = movers[i].o.position.x; sh = Math.max(sh, Math.exp(-(((x - 0.3) / 1.4) ** 2))); }
      const k = 1 - 0.55 * sh; sunL.intensity = 14 * k; (sunShaft.material as THREE.MeshBasicMaterial).opacity = 0.12 * k; (patch.material as THREE.MeshBasicMaterial).opacity = 0.35 * k;
      const fl = 0.96 + 0.04 * Math.sin(t * 17) * Math.sin(t * 5.1); pendL.intensity = 5 * fl; (pendGlow.material as THREE.SpriteMaterial).opacity = 0.8 * fl;
      sconces.forEach((s, i) => { s.L.intensity = 2.2 * (0.96 + 0.04 * Math.sin(t * 13 + i)); });
      corrLamps.forEach((g, i) => ((g.material as THREE.SpriteMaterial).opacity = 0.7 + 0.05 * Math.sin(t * 11 + i)));
      // story: suitcase lid, door
      const cs = cl01(c.case ?? 0); lidG.rotation.z = 1.45 * cs * cs * (3 - 2 * cs);
      doorG.position.set(0.86 * cl01(c.door ?? 0), 0, ZC - 0.03);
    },
  };
};
