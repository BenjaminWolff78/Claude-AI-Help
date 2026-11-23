// "They Banned Cars One Day a Week and Got More Cars" (2026-11-21): Mexico City, 1989. ORIGINAL set. Local metres, y up.
//  HOME STREET (x -40..40): road z -3..3, sidewalks z -5.2..-3 (north) and 3..5.2 (south), y 0.14. Colourful stucco
//    houses both sides. MEMO'S HOUSE north x 0..8.4 (front z -5.2): door x 1.2 with a step, the KEY RACK on the wall
//    x 2.6, the CARPORT x 3.6..7.8 (back wall z -9.4) with the WEEK BOARD and a stool. Memo's green car at the north
//    kerb (x -3, z -2.05, nose +x); the rusty car parks behind it (x -10.5). HUGO'S house south, his iron gate at
//    (-2, 3.2). Street lamp (-6.8, -3.35). RULE SIGN post (9.6, -3.4). BUS STOP x -23..-18 north.
//  AVENUE (x 110..290 around X0 = 200): six lanes z -8..8, all heading +x. Checkpoint barrier x 199.2 (north lanes),
//    CITY HALL north (facade z -11, balcony y 4.4) with the lectern, the DAY-TILE board and the AIR gauge; the TOW YARD
//    south (z 9..16) with the flip COUNTER; the FOOTBRIDGE at x 226 (deck y 5.2).
import * as THREE from "three";
import { Batch, V, lam, quad, boxGeo } from "../build";
import { ctex, rep } from "../paint";
import { NOINK } from "../ink";
import { glow, mist, rod } from "../setkit";
import { tropicHouse, TROPIC_HOUSES, hill, stringLights, fitText } from "./portkit_common";
import { asphaltTex, stuccoTex, winTex, powerPole, wire, hash, SANS } from "./desertkit";
import { roundTree, leafTex } from "./innerkit_b";
import { sedan, type Sedan } from "./sedan";
import type { SetDef, V3 } from "./types";

const TAU = Math.PI * 2;
const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const M = (key: string, color: string, map?: THREE.Texture, extra: THREE.MeshLambertMaterialParameters = {}) => lam("mx" + key, () => ({ color, ...(map ? { map } : {}), ...extra }));
const unlit = (map: THREE.Texture) => new THREE.MeshBasicMaterial({ map, color: new THREE.Color(1, 1, 1), toneMapped: true });
const bx = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (r0: number, r1: number, h: number, n = 24) => new THREE.CylinderGeometry(r0, r1, h, n);

export const AX = 200;
export const DAYS: [string, string][] = [["MON", "5 · 6"], ["TUE", "7 · 8"], ["WED", "3 · 4"], ["THU", "1 · 2"], ["FRI", "9 · 0"]];
export const MX = {
  GREEN: [-3, 0, -2.05] as V3, RUST: [-10.5, 0, -2.05] as V3, KERB: [-5.9, 0.14, -3.25] as V3, LAMP: [-6.8, 0, -3.35] as V3,
  DOOR: [1.2, 0.3, -4.75] as V3, STEP: [1.2, 0.3, -4.85] as V3, SHELF: [0.25, 1.05, -5.1] as V3, RACK: [2.65, 1.5, -5.16] as V3,
  PORT: [5.7, 0.14, -7.3] as V3, WEEK: [5.6, 1.55, -9.33] as V3, STOOL: [4.6, 0.14, -8.6] as V3, PORTPOST: [3.6, 0.14, -5.0] as V3,
  GATE: [-2, 0.14, 3.55] as V3, HUGOCARPARK: [3.6, 0, 2.05] as V3, RULE: [9.6, 3.0, -3.4] as V3, LADDER: [9.6, 0.14, -2.75] as V3,
  BUS: [-20.5, 0.14, -3.9] as V3, QUEUE: [[-19.0, 0.14, -3.75], [-20.1, 0.14, -4.25], [-21.2, 0.14, -3.8], [-22.2, 0.14, -4.3], [-23.2, 0.14, -3.85], [-24.2, 0.14, -4.35]] as V3[],
  // avenue
  BAR: [AX - 0.8, 0, -5.6] as V3, COP: [AX - 0.55, 0, -5.55] as V3, MEMOAV: [AX - 2.35, 0, -3.8] as V3,
  BALC: [AX + 3, 4.4, -10.3] as V3, LECT: [AX + 3, 4.4, -9.85] as V3, TILES: [AX + 6.3, 6.3, -10.9] as V3, CLERK: [AX + 7.3, 5.05, -10.15] as V3,
  GAUGE: [AX + 27.2, 8.3, -4.6] as V3, COUNTER: [AX + 6, 2.3, 9.3] as V3, TOW: [AX + 9.2, 0, 6.5] as V3, TOWED: [AX + 13.3, 0, 6.5] as V3,
  COPB: [AX + 5.75, 0, 7.45] as V3, STOPPED: [AX + 2.6, 0, 6.4] as V3, SLUMP: [AX + 3.2, 0.14, 8.45] as V3,
  BRIDGE: [AX + 26, 5.2, 0] as V3, ECON: [AX + 25.55, 5.2, 1.2] as V3,
};
/** the five day slots of the week board (toy-car shelf centres) and the tray the toy cars start in */
export const slotAt = (k: number): V3 => [MX.WEEK[0] - 0.72 + k * 0.36, MX.WEEK[1] - 0.2, MX.WEEK[2] + 0.1];
export const trayAt = (k: number): V3 => [MX.WEEK[0] - 0.45 + k * 0.24, 0.98, MX.WEEK[2] + 0.42];
export const toyAt = (k: number, u: number): V3 => { const a = trayAt(k), b = slotAt(k), e = sm(u); return [lerp(a[0], b[0], e), lerp(a[1], b[1], e) + 0.25 * Math.sin(Math.PI * e), lerp(a[2], b[2], e)]; };

// ---------------- textures ----------------
const plateTex = (txt: string) => ctex("mxPlate" + txt, 512, 256, (g) => { g.fillStyle = "#f4f1e4"; g.fillRect(0, 0, 512, 256); g.fillStyle = "#2f7a4a"; g.fillRect(0, 0, 512, 46); g.fillRect(0, 214, 512, 42);
  g.strokeStyle = "#26222c"; g.lineWidth = 12; g.strokeRect(6, 6, 500, 244); g.fillStyle = "#f4f1e4"; g.font = "900 30px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("DISTRITO  CAPITAL", 256, 24);
  g.fillStyle = "#1a1a22"; fitText(g, txt, 256, 132, 460, 150, SANS); });
const dayTileTex = (d: string, n: string, sat = false) => ctex("mxTile" + d + n, 256, 320, (g) => { g.fillStyle = sat ? "#c8352e" : "#f6efd8"; g.fillRect(0, 0, 256, 320); g.strokeStyle = "#26222c"; g.lineWidth = 10; g.strokeRect(5, 5, 246, 310);
  g.fillStyle = sat ? "#fff4d6" : "#c8352e"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, d, 128, 78, 210, 92, SANS); g.fillStyle = sat ? "#fff4d6" : "#1a1a22"; fitText(g, n, 128, 214, 220, 104, SANS); });
const headTex = (key: string, lines: string[], bg: string, fg: string, w = 1024, h = 256) => ctex("mxHead" + key, w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle"; lines.forEach((l, i) => fitText(g, l, w / 2, (h * (i + 0.5)) / lines.length + 4, w - 70, (h / lines.length) * 0.74, SANS)); });
const paperTex = () => ctex("mxPaper", 1024, 1280, (g, r) => { g.fillStyle = "#ece6d4"; g.fillRect(0, 0, 1024, 1280); g.fillStyle = "#1a1a22"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "900 70px Georgia"; g.fillText("THE CAPITAL DAILY", 512, 70); g.fillRect(40, 118, 944, 8); fitText(g, "2.3 MILLION", 512, 270, 930, 250, SANS); fitText(g, "CARS PARKED", 512, 480, 930, 190, SANS);
  g.fillStyle = "#8a8474"; g.fillRect(60, 620, 904, 330); g.fillStyle = "#5a5648"; for (let i = 0; i < 9; i++) { g.fillRect(90 + i * 98, 760 + (i % 3) * 30, 80, 44); g.fillRect(104 + i * 98, 730 + (i % 3) * 30, 50, 34); }
  g.fillStyle = "#3a3a44"; for (let y = 1000; y < 1250; y += 34) for (let c = 0; c < 2; c++) g.fillRect(60 + c * 470, y, 300 + r() * 130, 12); });
const dayRowTex = (d: string, n: string) => ctex("mxRow" + d + n, 640, 256, (g) => { g.fillStyle = "#f6efd8"; g.fillRect(0, 0, 640, 256); g.strokeStyle = "#26222c"; g.lineWidth = 12; g.strokeRect(6, 6, 628, 244); g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#c8352e"; fitText(g, d, 170, 132, 270, 130, SANS); g.fillStyle = "#1a1a22"; fitText(g, n, 450, 132, 300, 150, SANS); });
const digitTexW = (n: number) => ctex("mxDigW" + n, 128, 192, (g) => { g.fillStyle = "#fbf6e6"; g.fillRect(0, 0, 128, 192); g.strokeStyle = "#8a8578"; g.lineWidth = 6; g.strokeRect(3, 3, 122, 186); g.fillStyle = "#15151b"; g.font = "900 160px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(n), 64, 104); });
const digitTex = (n: number) => ctex("mxDig" + n, 128, 192, (g) => { g.fillStyle = "#1c1c22"; g.fillRect(0, 0, 128, 192); g.fillStyle = "#f6efd8"; g.font = "900 150px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(n), 64, 104); g.fillStyle = "rgba(0,0,0,0.5)"; g.fillRect(0, 93, 128, 5); });
const gaugeTex = () => ctex("mxGauge", 512, 512, (g) => { g.fillStyle = "#f2ead6"; g.beginPath(); g.arc(256, 256, 250, 0, TAU); g.fill(); g.lineWidth = 16; g.strokeStyle = "#26222c"; g.stroke();
  const seg: [number, number, string, string][] = [[Math.PI, Math.PI * 1.33, "#4caf50", "GOOD"], [Math.PI * 1.33, Math.PI * 1.67, "#f2c230", "SO-SO"], [Math.PI * 1.67, TAU, "#c8352e", "BAD"]];
  for (const [a0, a1, c, t] of seg) { g.beginPath(); g.arc(256, 280, 190, a0, a1); g.lineWidth = 60; g.strokeStyle = c; g.stroke(); const am = (a0 + a1) / 2; g.save(); g.translate(256 + Math.cos(am) * 190, 280 + Math.sin(am) * 190); g.rotate(am + Math.PI / 2); g.fillStyle = "#1a1a22"; g.font = "900 34px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, 0, 0); g.restore(); }
  g.fillStyle = "#1a1a22"; g.font = "900 86px Arial"; g.textAlign = "center"; g.fillText("AIR", 256, 420); });
const facadeTex = (c: string, seed: number) => ctex("mxFac" + c + seed, 512, 512, (g, r) => { g.fillStyle = c; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "40,30,30" : "255,250,235"},${0.03 + r() * 0.05})`; g.fillRect(r() * 512, r() * 512, 3 + r() * 30, 2 + r() * 8); }
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = "#2a3644"; g.fillRect(34 + x * 124, 30 + y * 126, 70, 84); g.fillStyle = r() < 0.4 ? "#ffd98a" : "#6a8aa4"; g.fillRect(40 + x * 124, 36 + y * 126, 58, 72); g.fillStyle = "rgba(20,20,30,0.35)"; g.fillRect(40 + x * 124, 70 + y * 126, 58, 4); g.fillStyle = "rgba(60,40,30,0.25)"; g.fillRect(34 + x * 124, 116 + y * 126, 70, 16 + r() * 30); } });
const paveTex = () => ctex("mxPave", 512, 512, (g, r) => { g.fillStyle = "#b8b0a2"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "60,52,46" : "236,228,210"},${0.05 + r() * 0.1})`; g.fillRect(r() * 512, r() * 512, 2 + r() * 8, 2 + r() * 5); }
  g.strokeStyle = "#7c7468"; g.lineWidth = 5; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(512, i * 128); g.stroke(); }
  for (let i = 0; i < 14; i++) { g.strokeStyle = "rgba(50,44,40,0.5)"; g.lineWidth = 2; let x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); } });
const rustTex = (base: string) => ctex("mxRust" + base, 256, 256, (g, r) => { g.fillStyle = base; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 70; i++) { const x = r() * 256, y = r() * 256, s = 6 + r() * 26; g.fillStyle = `rgba(${r() < 0.6 ? "110,52,24" : "70,36,22"},${0.25 + r() * 0.4})`; g.beginPath(); g.ellipse(x, y, s, s * (0.4 + r() * 0.6), r() * 3, 0, TAU); g.fill(); } for (let i = 0; i < 12; i++) { g.fillStyle = "rgba(170,170,170,0.5)"; g.fillRect(r() * 256, r() * 256, 20 + r() * 30, 14 + r() * 20); } });

type Wreck = { car: Sedan; puffs: THREE.Sprite[]; plateF: THREE.Mesh; plateB: THREE.Mesh };
export const mexset = (): SetDef => {
  const root = new THREE.Group(), b = new Batch();
  const asph = M("Asph", "#ffffff", rep(asphaltTex(true), 14, 1)), asphA = M("AsphA", "#ffffff", rep(asphaltTex(true), 30, 3)), pave = M("Pave", "#ffffff", rep(paveTex(), 40, 1.1)), kerb = M("Kerb", "#d9d2c2");
  const iron = M("Iron", "#33303a"), white = M("White", "#f2ead6"), wood = M("Wood", "#8a6038"), red = M("Red", "#c8352e"), conc = M("Conc", "#b9b2a6"), dark = M("Dark", "#3c3944");
  const sign = (tex: THREE.Texture, w: number, h: number, pos: V3, yaw = 0, parent: THREE.Object3D = root) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), unlit(tex)); m.position.set(...pos); m.rotation.y = yaw; parent.add(m); return m; };
  const boxM = (w: number, h: number, d: number, mat: THREE.Material, pos: V3, parent: THREE.Object3D = root) => { const m = new THREE.Mesh(bx(w, h, d), mat); m.position.set(...pos); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };

  // ======================= HOME STREET =======================
  { const g = new THREE.Mesh(new THREE.PlaneGeometry(700, 500).rotateX(-Math.PI / 2), M("Dirt", "#8f8676")); g.position.set(120, -0.03, 0); g.receiveShadow = true; root.add(g); }
  { const rd = new THREE.Mesh(new THREE.PlaneGeometry(100, 6).rotateX(-Math.PI / 2), asph); rd.receiveShadow = true; root.add(rd); }
  b.add(boxGeo(V(-50, 0, -5.2), V(50, 0.14, -3)), pave); b.add(boxGeo(V(-50, 0, 3), V(50, 0.14, 5.2)), pave);
  b.add(boxGeo(V(-50, 0, -3.08), V(50, 0.15, -2.94)), kerb); b.add(boxGeo(V(-50, 0, 2.94), V(50, 0.15, 3.08)), kerb);
  for (let i = 0; i < 26; i++) { const x = -48 + i * 3.9 + hash(i) * 1.2, z = (hash(i, 3) - 0.5) * 5; b.add(bx(0.5 + hash(i, 5) * 0.9, 0.012, 0.3 + hash(i, 7) * 0.5).translate(x, 0.008, z), M("Patch", "#4a4850")); }   // tar patches
  // houses: north row faces +z (front at z -5.2), south row faces -z (front at z 5.2); Memo's lot (x 0..8.4) and Hugo's (x -5.2..1.2) are custom
  const lot = (i: number) => TROPIC_HOUSES[((i % 6) + 6) % 6];
  for (let i = -6; i <= 6; i++) { const x = i * 6.6 - 3.3; if (x > -1.5 && x < 9.5) continue; tropicHouse(b, x + (x > 9 ? 1.6 : 0), -5.2 - 3.4, 0, 6.2, 6.8, 5.6 + hash(i) * 1.6, lot(i + 9), i % 2 === 0, "n" + i); }
  for (let i = -6; i <= 6; i++) { const x = i * 6.6 + 1.2; if (x > -6 && x < 2) continue; tropicHouse(b, x, 5.2 + 3.4, Math.PI, 6.2, 6.8, 5.4 + hash(i, 2) * 1.8, lot(i + 2), i % 2 !== 0, "s" + i); }
  // roof water tanks, antennas
  for (let i = 0; i < 16; i++) { const x = -42 + i * 5.6, n = i % 2 === 0, z = n ? -9.5 : 9.3; b.add(cyl(0.55, 0.55, 1.1, 16).translate(x, 6.9 + hash(i) * 1.2, z), dark); rod(root, [x + 1.4, 6.2, z], [x + 1.4, 9 + hash(i, 4), z], 0.02, iron); }
  // MEMO'S HOUSE: stucco box with a door, a window, the carport opening
  { const st = M("MemoWall", "#ffffff", rep(stuccoTex("#e9c46a"), 2, 2)), st2 = M("MemoIn", "#ffffff", rep(stuccoTex("#a89478"), 2, 2)), trim = M("MemoTrim", "#2f7a8a");
    b.add(boxGeo(V(0, 0, -11.5), V(8.4, 6.0, -9.5)), st);                                    // rear block
    b.add(boxGeo(V(0, 0, -9.5), V(3.6, 6.0, -5.2)), st);                                     // the house part (door + window)
    b.add(boxGeo(V(7.8, 0, -9.5), V(8.4, 6.0, -5.2)), st); b.add(boxGeo(V(3.6, 2.9, -9.5), V(7.8, 6.0, -5.2)), st);   // carport pier + the room over it
    b.add(boxGeo(V(3.6, 0.14, -9.5), V(7.8, 0.16, -5.2)), conc); b.add(boxGeo(V(3.62, 0.16, -9.48), V(7.78, 2.9, -9.4)), st2);  // carport floor + back wall
    b.add(boxGeo(V(0.55, 0.14, -5.24), V(1.85, 2.35, -5.17)), M("Door", "#7a4a2a")); b.add(boxGeo(V(0.45, 2.35, -5.26), V(1.95, 2.5, -5.15)), trim); b.add(cyl(0.05, 0.05, 0.05, 12).rotateX(Math.PI / 2).translate(1.7, 1.2, -5.14), M("Brass", "#d8a83a"));
    b.add(boxGeo(V(0.5, 0.14, -5.2), V(1.9, 0.3, -4.5)), conc);                               // the step
    b.add(boxGeo(V(2.1, 3.4, -5.25), V(3.3, 4.9, -5.16)), M("Glass", "#9cc4d8")); b.add(boxGeo(V(2.0, 3.3, -5.27), V(3.4, 3.4, -5.1)), trim);
    b.add(boxGeo(V(-0.1, 5.9, -11.6), V(8.5, 6.15, -5.05)), trim);                            // roof lip
    // sneaker shelf by the door
    b.add(boxGeo(V(-0.15, 0.98, -5.2), V(0.5, 1.02, -4.95)), wood);
    // key rack
    b.add(boxGeo(V(2.25, 1.32, -5.2), V(3.05, 1.72, -5.17)), wood); for (let k = 0; k < 3; k++) b.add(cyl(0.012, 0.012, 0.08, 8).rotateX(Math.PI / 2).translate(2.41 + k * 0.24, 1.46, -5.14), iron);
    sign(headTex("keys", ["KEYS"], "#f6efd8", "#26222c", 256, 64), 0.5, 0.12, [2.65, 1.65, -5.165]);
    // carport: stool, work shelf (the toy-car tray), oil cans, a tyre, a hanging bulb
    b.add(cyl(0.2, 0.2, 0.05, 20).translate(MX.STOOL[0], 0.66, MX.STOOL[2]), wood); for (let k = 0; k < 3; k++) { const a = (k * TAU) / 3; rod(root, [MX.STOOL[0] + Math.cos(a) * 0.14, 0.64, MX.STOOL[2] + Math.sin(a) * 0.14], [MX.STOOL[0] + Math.cos(a) * 0.2, 0.16, MX.STOOL[2] + Math.sin(a) * 0.2], 0.02, wood); }
    b.add(boxGeo(V(MX.WEEK[0] - 1.0, 0.9, MX.WEEK[2] + 0.02), V(MX.WEEK[0] + 1.0, 0.94, MX.WEEK[2] + 0.6)), wood); for (const sx of [-0.95, 0.95]) b.add(boxGeo(V(MX.WEEK[0] + sx - 0.03, 0.16, MX.WEEK[2] + 0.5), V(MX.WEEK[0] + sx + 0.03, 0.9, MX.WEEK[2] + 0.56)), wood);
    for (let k = 0; k < 3; k++) b.add(cyl(0.09, 0.09, 0.26, 16).translate(7.3 - k * 0.24, 0.29, -9.1 + (k % 2) * 0.2), k === 1 ? red : M("OilCan", "#3a6a8a"));
    b.add(new THREE.TorusGeometry(0.3, 0.11, 10, 24).rotateY(0.4).translate(7.35, 0.56, -8.2), dark); b.add(new THREE.TorusGeometry(0.3, 0.11, 10, 24).rotateX(Math.PI / 2).translate(4.0, 0.27, -6.0), dark);
    rod(root, [5.7, 2.9, -7.6], [5.7, 2.45, -7.6], 0.01, iron);
    b.add(boxGeo(V(6.75, 1.15, -9.4), V(7.7, 2.25, -9.36)), M("Peg", "#6a4a30")); for (let k = 0; k < 4; k++) { b.add(bx(0.05, 0.42 + (k % 2) * 0.14, 0.03).translate(6.9 + k * 0.22, 1.75, -9.34), iron); b.add(bx(0.14, 0.09, 0.04).translate(6.9 + k * 0.22, 2.0 + (k % 2) * 0.07, -9.34), k % 2 ? red : M("Tool", "#9aa0a8")); }
    b.add(boxGeo(V(3.66, 1.9, -9.38), V(3.9, 2.5, -9.36)), white); b.add(boxGeo(V(3.66, 2.38, -9.36), V(3.9, 2.5, -9.35)), red);
    b.add(boxGeo(V(3.62, 1.2, -8.9), V(3.86, 1.24, -6.4)), wood); for (let k = 0; k < 6; k++) b.add(cyl(0.07, 0.07, 0.2, 12).translate(3.74, 1.35, -8.7 + k * 0.42), M("Jar" + (k % 3), ["#c8a03a", "#5a8a6a", "#a84a3a"][k % 3]));
    for (let k = 0; k < 7; k++) b.add(bx(4.2, 0.012, 0.02).translate(5.7, 0.166, -9.3 + k * 0.62), M("Crack", "#8a8478"));
  }
  const bulb = glow(root, [5.7, 2.38, -7.6], "#ffd9a0", 0.55, 0.9); const bulbL = new THREE.PointLight("#ffcf90", 0, 9, 1.6); bulbL.position.set(5.7, 2.3, -7.6); root.add(bulbL);
  // the WEEK BOARD (carport back wall): five day tiles over five little shelves; five toy cars
  { boxM(1.96, 0.96, 0.04, wood, [MX.WEEK[0], MX.WEEK[1], MX.WEEK[2] + 0.02]);
    DAYS.forEach(([d, n], k) => { sign(dayTileTex(d, n), 0.32, 0.4, [MX.WEEK[0] - 0.72 + k * 0.36, MX.WEEK[1] + 0.22, MX.WEEK[2] + 0.045]); b.add(bx(0.32, 0.025, 0.16).translate(MX.WEEK[0] - 0.72 + k * 0.36, MX.WEEK[1] - 0.27, MX.WEEK[2] + 0.1), white); }); }
  const toys: THREE.Group[] = [0, 1, 2, 3, 4].map((k) => { const g = new THREE.Group(), rust = k === 0 || k === 3; const body = M(rust ? "ToyRust" : "ToyGreen", rust ? "#9a5226" : "#3f9a62");
    const add = (geo: THREE.BufferGeometry, m: THREE.Material) => { const me = new THREE.Mesh(geo, m); me.castShadow = true; g.add(me); };
    add(bx(0.24, 0.06, 0.11).translate(0, 0.055, 0), body); add(bx(0.13, 0.05, 0.1).translate(-0.01, 0.11, 0), body); add(bx(0.11, 0.035, 0.102).translate(-0.01, 0.112, 0), M("ToyGlass", "#bfe0ee"));
    for (const sx of [-0.075, 0.075]) for (const sz of [-0.055, 0.055]) add(cyl(0.03, 0.03, 0.02, 12).rotateX(Math.PI / 2).translate(sx, 0.03, sz), dark);
    root.add(g); return g; });
  // Hugo's house (south): plain stucco with a barred window, a low iron fence with a gate along the sidewalk edge
  { const st = M("HugoWall", "#ffffff", rep(stuccoTex("#e07a5f"), 2, 2)); b.add(boxGeo(V(-5.2, 0, 5.2), V(1.2, 5.6, 11.5)), st); b.add(boxGeo(V(-5.3, 5.5, 5.05), V(1.3, 5.75, 11.6)), M("HugoTrim", "#f2ead6"));
    b.add(boxGeo(V(-0.6, 0.14, 5.16), V(0.5, 2.3, 5.24)), M("HDoor", "#2f6f5a")); b.add(boxGeo(V(-4.4, 1.1, 5.16), V(-2.2, 2.5, 5.24)), M("HWin", "#ffd98a", undefined, { emissive: new THREE.Color("#5a3a10") }));
    for (let k = 0; k < 8; k++) rod(root, [-4.35 + k * 0.3, 1.1, 5.13], [-4.35 + k * 0.3, 2.5, 5.13], 0.018, iron);
    for (let k = 0; k <= 26; k++) { const x = -5.2 + k * 0.245; if (x > -2.6 && x < -1.4) continue; rod(root, [x, 0.14, 3.2], [x, 1.02, 3.2], 0.016, iron); }
    for (const [x0, x1] of [[-5.2, -2.6], [-1.4, 1.2]]) for (const y of [0.3, 0.95]) rod(root, [x0, y, 3.2], [x1, y, 3.2], 0.02, iron);
    for (const x of [-5.2, -2.6, -1.4, 1.2]) b.add(boxGeo(V(x - 0.06, 0.14, 3.14), V(x + 0.06, 1.15, 3.26)), iron);
    for (let k = 0; k < 4; k++) b.add(cyl(0.18, 0.14, 0.3, 14).translate(-4.6 + k * 0.5, 0.29, 4.5), M("Pot", "#b5562e")), b.add(new THREE.SphereGeometry(0.22, 10, 8).translate(-4.6 + k * 0.5, 0.6, 4.5), M("PotLeaf", k % 2 ? "#4a9a5a" : "#c8504a"));
  }
  const gate = new THREE.Group(); gate.position.set(-2.6, 0, 3.2); root.add(gate); for (let k = 0; k <= 5; k++) rod(gate, [k * 0.235, 0.16, 0], [k * 0.235, 1.0, 0], 0.016, iron); for (const y of [0.3, 0.95]) rod(gate, [0, y, 0], [1.18, y, 0], 0.02, iron);
  // street lamp + rule sign post + bus stop + power poles + trees + a taco cart
  rod(root, [MX.LAMP[0], 0.14, MX.LAMP[2]], [MX.LAMP[0], 4.3, MX.LAMP[2]], 0.06, iron); rod(root, [MX.LAMP[0], 4.3, MX.LAMP[2]], [MX.LAMP[0], 4.45, MX.LAMP[2] + 1.0], 0.04, iron); b.add(bx(0.3, 0.1, 0.5).translate(MX.LAMP[0], 4.42, MX.LAMP[2] + 1.05), iron);
  const lampG = glow(root, [MX.LAMP[0], 4.3, MX.LAMP[2] + 1.05], "#ffd9a0", 1.3, 0); const lampL = new THREE.PointLight("#ffcf90", 0, 16, 1.4); lampL.position.set(MX.LAMP[0], 4.1, MX.LAMP[2] + 1.05); root.add(lampL);
  rod(root, [MX.RULE[0], 0.14, MX.RULE[2]], [MX.RULE[0], 4.2, MX.RULE[2]], 0.06, iron);
  sign(headTex("rule", ["NO-DRIVE DAY", "BY YOUR LAST PLATE NUMBER"], "#f6efd8", "#c8352e", 1024, 300), 2.0, 0.58, [MX.RULE[0], 3.72, MX.RULE[2] + 0.07]); boxM(2.06, 0.64, 0.05, iron, [MX.RULE[0], 3.72, MX.RULE[2] + 0.03]);
  DAYS.forEach(([d, n], k) => sign(dayTileTex(d, n), 0.38, 0.47, [MX.RULE[0] - 0.8 + k * 0.4, 3.12, MX.RULE[2] + 0.07])); boxM(2.06, 0.55, 0.05, iron, [MX.RULE[0], 3.12, MX.RULE[2] + 0.03]);
  const satPlate = new THREE.Group(); root.add(satPlate); boxM(0.5, 0.58, 0.05, iron, [0, 0, 0], satPlate); sign(dayTileTex("SAT", "ALL"), 0.44, 0.52, [0, 0, 0.03], 0, satPlate).scale.set(1, 1, 1);
  { const p = MX.BUS; rod(root, [p[0] - 1.6, 0.14, p[2] - 0.9], [p[0] - 1.6, 2.5, p[2] - 0.9], 0.04, iron); rod(root, [p[0] + 1.6, 0.14, p[2] - 0.9], [p[0] + 1.6, 2.5, p[2] - 0.9], 0.04, iron); b.add(bx(3.6, 0.07, 1.3).translate(p[0], 2.52, p[2] - 0.4), M("BusRoof", "#2f7a8a")); b.add(bx(3.2, 0.06, 0.4).translate(p[0], 0.6, p[2] - 0.8), wood);
    rod(root, [p[0] + 2.6, 0.14, p[2] + 0.7], [p[0] + 2.6, 3.0, p[2] + 0.7], 0.04, iron); sign(headTex("bus", ["BUS"], "#2f6fb0", "#f6efd8", 256, 160), 0.7, 0.44, [p[0] + 2.6, 2.8, p[2] + 0.76]); boxM(0.74, 0.48, 0.04, iron, [p[0] + 2.6, 2.8, p[2] + 0.73]); }
  { let prev: [V3, V3] | null = null; for (let i = 0; i < 6; i++) { const pp = powerPole(b, -44 + i * 17.5, 0.14, -4.9, Math.PI / 2, 8.6); if (prev) { wire(b, prev[0], pp[0], 0.9); wire(b, prev[1], pp[1], 0.8); } prev = pp; } }
  const leaf = M("Leaf", "#ffffff", leafTex("mxL", "#5a9a4a", "#9ad07a", "#2f6a34")), bark = M("Bark", "#6b4a2f");
  for (const [x, z] of [[-15.5, -4.3], [12.5, -4.4], [26, -4.3], [-30, 4.3], [8.5, 4.3], [21, 4.4]] as [number, number][]) roundTree(b, x, z, 4.2, 13 + x, leaf, bark, 0.14);
  { const x = 14.2, z = 4.0; b.add(bx(1.4, 0.8, 0.8).translate(x, 0.75, z), M("Cart", "#f2c230")); b.add(bx(1.7, 0.06, 1.1).translate(x, 2.05, z), red); for (const sx of [-0.65, 0.65]) rod(root, [x + sx, 1.15, z - 0.35], [x + sx, 2.05, z - 0.35], 0.02, iron); sign(headTex("tacos", ["TACOS"], "#c8352e", "#fff4d6", 256, 96), 1.1, 0.4, [x, 0.8, z - 0.41], Math.PI); for (const sx of [-0.5, 0.5]) b.add(cyl(0.22, 0.22, 0.06, 16).rotateX(Math.PI / 2).translate(x + sx, 0.36, z + 0.42), dark); }
  const xmas = new THREE.Group(); root.add(xmas); const cols = ["#ff6a5a", "#ffd27a", "#7ad0ff", "#8ae08a"]; const bulbs: THREE.Sprite[] = [];
  for (let i = 0; i < 9; i++) bulbs.push(...stringLights(xmas, [-40 + i * 9, 4.6, i % 2 ? 5.0 : -5.0], [-31 + i * 9, 4.6, i % 2 ? -5.0 : 5.0], 0.7, 12, "#ffd27a", cols).glows);

  // ======================= AVENUE =======================
  { const rd = new THREE.Mesh(new THREE.PlaneGeometry(230, 16).rotateX(-Math.PI / 2), asphA); rd.position.set(AX, 0.002, 0); rd.receiveShadow = true; root.add(rd); }
  b.add(boxGeo(V(AX - 115, 0, -11), V(AX + 115, 0.14, -8)), pave); b.add(boxGeo(V(AX - 115, 0, 8), V(AX + 115, 0.14, 9.2)), pave);
  // city hall (north): stone facade, columns, door, the balcony with a balustrade, flags
  { const stone = M("Hall", "#ffffff", rep(stuccoTex("#d8cfc0"), 5, 3)), stone2 = M("Hall2", "#b8ad9a");
    b.add(boxGeo(V(AX - 6, 0, -20), V(AX + 14, 12.5, -11)), stone); b.add(boxGeo(V(AX - 6.4, 12.5, -20.3), V(AX + 14.4, 13.2, -10.6)), stone2);
    for (let k = 0; k < 6; k++) b.add(cyl(0.38, 0.42, 4.26, 20).translate(AX - 4 + k * 3.2, 2.27, -10.2), stone2);
    b.add(boxGeo(V(AX - 5.2, 4.4 - 0.3, -11), V(AX + 13.2, 4.4, -9.3)), stone2);                                   // balcony slab
    for (let k = 0; k <= 46; k++) b.add(cyl(0.06, 0.08, 0.8, 8).translate(AX - 5.1 + k * 0.397, 4.8, -9.42), white); b.add(boxGeo(V(AX - 5.2, 5.2, -9.52), V(AX + 13.2, 5.32, -9.32)), white);
    b.add(boxGeo(V(AX + 1.9, 4.4, -11.05), V(AX + 4.1, 7.6, -10.95)), M("HallDoor", "#4a3426")); b.add(boxGeo(V(AX + 2.0, 0.14, -11.05), V(AX + 4.0, 3.4, -10.95)), M("HallDoor2", "#3a2a20"));
    for (const x of [AX - 3.5, AX + 9.8]) for (const y of [5.6, 9.2]) b.add(boxGeo(V(x, y, -11.04), V(x + 1.5, y + 2.2, -10.96)), M("HallWin", "#5c7890"));
    { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.96, 3.0), new THREE.MeshBasicMaterial({ color: "#7d6748" })); m.position.set(AX + 3, 5.95, -10.94); root.add(m);
      for (const x of [AX + 2.02, AX + 3, AX + 3.98]) b.add(boxGeo(V(x - 0.05, 4.45, -10.95), V(x + 0.05, 7.45, -10.9)), M("HallDoorBar", "#5a4030"));
      for (const y of [5.4, 6.4, 7.42]) b.add(boxGeo(V(AX + 2.0, y - 0.04, -10.95), V(AX + 4.0, y + 0.04, -10.9)), M("HallDoorBar", "#5a4030")); }
    // lectern + rule board frame + ladder
    b.add(boxGeo(V(MX.LECT[0] - 0.42, 4.4, MX.LECT[2] - 0.2), V(MX.LECT[0] + 0.42, 5.2, MX.LECT[2] + 0.2)), wood); b.add(bx(0.95, 0.06, 0.55).rotateX(0.35).translate(MX.LECT[0], 5.25, MX.LECT[2]), M("Wood2", "#6a4426"));
    sign(headTex("seal", ["CITY HALL"], "#2f7a4a", "#f6efd8", 256, 128), 0.6, 0.3, [MX.LECT[0], 4.85, MX.LECT[2] + 0.205]);
    boxM(1.5, 3.7, 0.08, M("Board", "#2c3a34"), [MX.TILES[0], MX.TILES[1] + 0.15, MX.TILES[2] + 0.04]); sign(headTex("ndd", ["NO-DRIVE", "DAY"], "#2c3a34", "#f6efd8", 512, 256), 1.3, 0.6, [MX.TILES[0], MX.TILES[1] + 1.62, MX.TILES[2] + 0.085]);
    for (const sx of [-0.25, 0.25]) rod(root, [MX.CLERK[0] + sx, 4.4, -9.75], [MX.CLERK[0] + sx, 7.3, -10.82], 0.03, wood); for (let k = 0; k < 7; k++) rod(root, [MX.CLERK[0] - 0.25, 4.8 + k * 0.36, -9.9 - k * 0.132], [MX.CLERK[0] + 0.25, 4.8 + k * 0.36, -9.9 - k * 0.132], 0.022, wood);
    sign(headTex("y89", ["1989"], "#f6efd8", "#c8352e", 256, 128), 0.9, 0.45, [AX + 0.6, 6.6, -10.94]); boxM(0.96, 0.52, 0.04, iron, [AX + 0.6, 6.6, -10.97]);
    for (const x of [AX - 5, AX + 13]) { rod(root, [x, 4.4, -9.5], [x, 8.4, -9.5], 0.04, iron); }
  }
  const tiles = DAYS.map(([d, n], k) => { const m = sign(dayRowTex(d, n), 1.3, 0.52, [MX.TILES[0], MX.TILES[1] + 1.0 - k * 0.6, MX.TILES[2] + 0.09]); m.visible = false; return m; });
  const flags = [AX - 5, AX + 13].map((x, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9, 8, 2), M("Flag" + i, i ? "#c8352e" : "#2f7a4a", undefined, { side: THREE.DoubleSide })); m.position.set(x + 0.78, 7.9, -9.5); root.add(m); return m; });
  const needle = new THREE.Group(); { const gg = new THREE.Group(); gg.position.set(...MX.GAUGE); gg.rotation.y = Math.PI / 2; root.add(gg); sign(gaugeTex(), 3.4, 3.4, [0, 0, 0], 0, gg); boxM(3.5, 3.5, 0.1, iron, [0, 0, -0.06], gg); const n = new THREE.Mesh(bx(0.09, 1.3, 0.03).translate(0, 0.65, 0), M("Needle", "#1a1a22")); needle.add(n); needle.position.set(0, -0.16, 0.03); gg.add(needle);
    for (const z of [-6.2, -3.0]) rod(root, [MX.GAUGE[0] - 0.1, 6.2, z], [MX.GAUGE[0] - 0.1, 8.3, z], 0.06, iron); }
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.5).translate(0, -0.75, 0), unlit(headTex("clean", ["CLEAN AIR!"], "#f6efd8", "#2f7a4a", 1024, 300))); banner.position.set(MX.LECT[0] + 0.2, 4.1, -9.28); root.add(banner);
  // checkpoint: booth + barrier arm (north three lanes)
  b.add(boxGeo(V(AX - 1.6, 0.14, -9.6), V(AX - 0.1, 2.5, -8.3)), M("Booth", "#f2ead6")); b.add(boxGeo(V(AX - 1.75, 2.5, -9.75), V(AX + 0.05, 2.65, -8.15)), red); b.add(boxGeo(V(AX - 1.5, 1.2, -8.32), V(AX - 0.2, 2.1, -8.28)), M("BoothWin", "#9cc4d8"));
  b.add(boxGeo(V(AX - 1.0, 0, -8.25), V(AX - 0.6, 1.25, -7.85)), M("BarPost", "#f2c230"));
  const bar = new THREE.Group(); bar.position.set(AX - 0.8, 0.78, -8.05); root.add(bar);
  { const st = ctex("mxBarT", 512, 32, (g) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#f4f1ea" : "#c8352e"; g.fillRect(i * 32, 0, 32, 32); } }); const arm = new THREE.Mesh(bx(0.12, 0.12, 6.6).translate(0, 0, 3.3), M("BarArm", "#ffffff", st)); arm.castShadow = true; bar.add(arm); const cw = new THREE.Mesh(bx(0.3, 0.3, 0.5).translate(0, 0, -0.45), iron); bar.add(cw); }
  sign(headTex("stop", ["CHECKPOINT", "SHOW YOUR PLATE"], "#c8352e", "#fff4d6", 512, 256), 1.3, 0.65, [AX - 0.85, 3.1, -8.9], 0.0);
  // tow yard (south): chain fence, impounded cars, the flip counter, the tow truck
  for (let k = 0; k <= 12; k++) rod(root, [AX + 2 + k * 1.5, 0.14, 9.2], [AX + 2 + k * 1.5, 2.2, 9.2], 0.03, iron); for (const y of [0.5, 1.3, 2.15]) rod(root, [AX + 2, y, 9.2], [AX + 20, y, 9.2], 0.014, iron);
  boxM(2.5, 1.5, 0.12, iron, [MX.COUNTER[0], MX.COUNTER[1], MX.COUNTER[2] + 0.02]); sign(headTex("stopped", ["STOPPED TODAY"], "#1c1c22", "#f2c230", 1024, 128), 2.3, 0.3, [MX.COUNTER[0], MX.COUNTER[1] + 0.5, MX.COUNTER[2] - 0.05], Math.PI);
  for (const sx of [-1.0, 1.0]) rod(root, [MX.COUNTER[0] + sx, 0.14, MX.COUNTER[2] + 0.05], [MX.COUNTER[0] + sx, 1.6, MX.COUNTER[2] + 0.05], 0.05, iron);
  const digits: THREE.Mesh[] = [0, 1, 2, 3].map((k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.75), unlit(digitTex(0))); m.position.set(MX.COUNTER[0] - 0.81 + k * 0.54, MX.COUNTER[1] - 0.2, MX.COUNTER[2] - 0.05); m.rotation.y = Math.PI; root.add(m); return m; });
  const crank = new THREE.Group(); crank.position.set(MX.COUNTER[0] - 1.32, 1.5, MX.COUNTER[2] - 0.02); root.add(crank); rod(root, [MX.COUNTER[0] - 1.32, 1.5, MX.COUNTER[2] + 0.02], [MX.COUNTER[0] - 1.25, MX.COUNTER[1] - 0.2, MX.COUNTER[2] + 0.02], 0.02, iron); rod(crank, [0, 0, 0], [0, 0.22, 0], 0.02, iron); rod(crank, [0, 0.22, 0], [-0.12, 0.22, 0], 0.025, red);
  const truck = new THREE.Group(); truck.position.set(...MX.TOW); truck.rotation.y = Math.PI / 2; root.add(truck);
  { const tb = M("Truck", "#f2c230"); const add = (geo: THREE.BufferGeometry, m: THREE.Material) => { const me = new THREE.Mesh(geo, m); me.castShadow = true; truck.add(me); };
    add(bx(1.9, 1.1, 1.7).translate(0, 1.25, 1.7), tb); add(bx(1.7, 0.5, 1.2).translate(0, 1.9, 1.6), M("TruckGlass", "#9cc4d8")); add(bx(1.9, 0.6, 3.4).translate(0, 0.9, -0.9), tb); add(bx(0.16, 0.16, 2.6).rotateX(-0.6).translate(0, 2.0, -1.5), iron);
    for (const sx of [-0.9, 0.9]) for (const sz of [-1.7, 1.5]) add(cyl(0.42, 0.42, 0.3, 20).rotateZ(Math.PI / 2).translate(sx, 0.42, sz), dark); add(bx(0.5, 0.16, 0.3).translate(0, 2.2, 1.6), red); }
  const hook = new THREE.Group(); root.add(hook); rod(hook, [0, 0, 0], [0, -1.0, 0], 0.012, iron); { const h = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 6, 14, Math.PI * 1.4), iron); h.position.y = -1.08; hook.add(h); }
  // footbridge at x AX+26
  { const bxm = AX + 26; b.add(boxGeo(V(bxm - 1.1, 4.95, -10.5), V(bxm + 1.1, 5.2, 10.5)), conc); for (const z of [-9.6, 9.6]) for (const sx of [-0.8, 0.8]) b.add(boxGeo(V(bxm + sx - 0.2, 0, z - 0.2), V(bxm + sx + 0.2, 4.95, z + 0.2)), conc);
    for (const sx of [-1.05, 1.05]) { for (let k = 0; k <= 30; k++) rod(root, [bxm + sx, 5.2, -10.4 + k * 0.693], [bxm + sx, 6.2, -10.4 + k * 0.693], 0.02, iron); rod(root, [bxm + sx, 6.2, -10.4], [bxm + sx, 6.2, 10.4], 0.035, iron); rod(root, [bxm + sx, 5.7, -10.4], [bxm + sx, 5.7, 10.4], 0.02, iron); } }
  // skyline both sides + far mountains
  for (let i = 0; i < 46; i++) { const n = i % 2 === 0, x = AX - 112 + i * 5 + hash(i) * 3, w = 7 + hash(i, 2) * 6, h = 8 + hash(i, 3) * 22, z = n ? -22 - hash(i, 4) * 16 : 18 + hash(i, 5) * 14; if (n && x > AX - 9 && x < AX + 17) continue;
    b.add(boxGeo(V(x - w / 2, 0, z - 5), V(x + w / 2, h, z + 5)), M("Sky" + (i % 5), "#ffffff", rep(facadeTex(["#c9b79a", "#b8a48e", "#d6c0a0", "#a89a8c", "#cbb0a0"][i % 5], i % 5), w / 7, h / 9))); }
  hill(root, [AX - 60, -6, -330], 150, 46, 60, "#8a7a6a", 3); hill(root, [AX - 20, -6, 300], 120, 34, 50, "#94846e", 3); hill(root, [-120, -4, -230], 90, 22, 40, "#8a8a6a", 3); hill(root, [60, -4, 250], 110, 26, 40, "#8f8468", 3);
  b.build(root);

  // ======================= CARS =======================
  const mkPlate = (car: Sedan, txt: string) => { const tail = car.NOSE - car.len; const f = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.29), unlit(plateTex(txt))); f.position.set(0, 0.47, car.NOSE + 0.26); car.g.add(f);
    const r = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.29), unlit(plateTex(txt))); r.position.set(0, 0.56, tail - 0.12); r.rotation.y = Math.PI; car.g.add(r); return [f, r] as const; };
  const mkWreck = (style: "tank" | "fin", body: string, txt: string): Wreck => { const car = sedan(root, { style, body, roof: body }); car.g.traverse((o) => { const me = o as THREE.Mesh; const mt = me.material as THREE.MeshLambertMaterial | undefined; if (mt && mt.color && "#" + mt.color.getHexString() === body.toLowerCase()) { me.material = M("Rust" + body, "#ffffff", rep(rustTex(body), 2, 1)); } });
    const [pf, pb] = mkPlate(car, txt); const puffs = [0, 1, 2, 3].map(() => mist(root, [0, -5, 0], 1.0, "#4a4648", 0)); return { car, puffs, plateF: pf, plateB: pb }; };
  const green = sedan(root, { style: "modern", body: "#3f9a62", roof: "#3f9a62" }); mkPlate(green, "417 KD5");
  const greenAv = sedan(root, { style: "modern", body: "#3f9a62", roof: "#3f9a62" }); mkPlate(greenAv, "417 KD5");
  const hugoCar = sedan(root, { style: "modern", body: "#3a6fc0", roof: "#3a6fc0" }); mkPlate(hugoCar, "902 HG1");
  const rust = mkWreck("tank", "#9a5226", "338 LM8");
  const wrecks: Wreck[] = [mkWreck("fin", "#8a6a3a", "771 PB2"), mkWreck("tank", "#6a5a4a", "150 RX9"), mkWreck("fin", "#a04a30", "264 TN3"), mkWreck("tank", "#7a4a2a", "845 VC1")];
  const stopped = sedan(root, { style: "fin", body: "#d8c070", roof: "#f2ead6" }); mkPlate(stopped, "603 AB5"); const towed = sedan(root, { style: "modern", body: "#c84a3a", roof: "#c84a3a" }); mkPlate(towed, "118 CC6");
  const avNear = [0, 1, 2, 3].map((k) => { const c = sedan(root, { style: k % 2 ? "fin" : "modern", body: ["#d8a83a", "#7a8aa8", "#c84a3a", "#e8e0d0"][k], roof: ["#d8a83a", "#f2ead6", "#c84a3a", "#e8e0d0"][k] }); mkPlate(c, ["552 DF5", "209 GH6", "731 JK5", "064 MN6"][k]); return c; });
  const smoked = new THREE.Group(); root.add(smoked);
  // kerb-parked low cars on the home street + the avenue fleet (instanced)
  const lowBody = (() => { const g1 = bx(4.1, 0.62, 1.7).translate(0, 0.62, 0), g2 = bx(2.1, 0.5, 1.5).translate(-0.2, 1.16, 0); const pos: number[] = [], nor: number[] = [], idx: number[] = []; let off = 0;
    for (const g of [g1, g2]) { const P = g.attributes.position, N = g.attributes.normal, I = g.index!; for (let i = 0; i < P.count; i++) { pos.push(P.getX(i), P.getY(i), P.getZ(i)); nor.push(N.getX(i), N.getY(i), N.getZ(i)); } for (let i = 0; i < I.count; i++) idx.push(I.getX(i) + off); off += P.count; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); geo.setIndex(idx); return geo; })();
  const lowWheels = (() => { const gs = [[-1.3, -0.86], [-1.3, 0.86], [1.3, -0.86], [1.3, 0.86]].map(([x, z]) => cyl(0.34, 0.34, 0.22, 12).rotateX(Math.PI / 2).translate(x, 0.34, z)); const pos: number[] = [], nor: number[] = [], idx: number[] = []; let off = 0;
    for (const g of gs) { const P = g.attributes.position, N = g.attributes.normal, I = g.index!; for (let i = 0; i < P.count; i++) { pos.push(P.getX(i), P.getY(i), P.getZ(i)); nor.push(N.getX(i), N.getY(i), N.getZ(i)); } for (let i = 0; i < I.count; i++) idx.push(I.getX(i) + off); off += P.count; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); geo.setIndex(idx); return geo; })();
  const CARC = ["#c84a3a", "#d8a83a", "#3a6fc0", "#e8e0d0", "#3f9a62", "#7a8aa8", "#8a5a3a", "#f2c230", "#6a4a7a", "#d87a4a", "#9aa0a8", "#2f7a8a"];
  const LANES = [-6.4, -3.8, -1.3, 1.3, 3.8, 6.4], ROWS = 34, NF = LANES.length * ROWS;
  const fleetB = new THREE.InstancedMesh(lowBody, new THREE.MeshLambertMaterial({ color: "#ffffff" }), NF), fleetW = new THREE.InstancedMesh(lowWheels, new THREE.MeshLambertMaterial({ color: "#2a2830" }), NF);
  fleetB.castShadow = true; fleetB.receiveShadow = true; fleetB.frustumCulled = false; fleetW.frustumCulled = false; root.add(fleetB, fleetW);
  for (let i = 0; i < NF; i++) fleetB.setColorAt(i, new THREE.Color(CARC[Math.floor(hash(i, 9) * CARC.length)]).multiplyScalar(0.92));
  const NK = 22, kerbB = new THREE.InstancedMesh(lowBody, new THREE.MeshLambertMaterial({ color: "#ffffff" }), NK), kerbW = new THREE.InstancedMesh(lowWheels, new THREE.MeshLambertMaterial({ color: "#2a2830" }), NK); kerbB.castShadow = true; kerbB.frustumCulled = false; kerbW.frustumCulled = false; root.add(kerbB, kerbW);
  const KERBX = [-38, -31.5, -25.5, 30, 36.5, 43, -44.5, -17.5, -36, -29, -22.5, -15.5, 27, 33, 39, 45, -42.5, -48, 49, 48, -50, 51];
  const dm = new THREE.Object3D();
  for (let i = 0; i < NK; i++) { const south = i >= 8 && i < 18; dm.position.set(KERBX[i], 0, south ? 2.05 : -2.05); dm.rotation.set(0, south ? Math.PI : 0, 0); dm.updateMatrix(); kerbB.setMatrixAt(i, dm.matrix); kerbW.setMatrixAt(i, dm.matrix); kerbB.setColorAt(i, new THREE.Color(CARC[(i * 5) % CARC.length])); }
  // smog layers over the avenue and the street end
  const smog = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => mist(root, [AX - 90 + k * 26, 7 + (k % 3) * 4, (k % 2 ? -1 : 1) * (6 + k * 2)], 70, "#b08a5a", 0));

  const place = (car: Sedan, x: number, z: number, yaw: number, y = 0) => { car.g.position.set(x, y, z); car.g.rotation.set(0, yaw, 0); };
  const exhaust = (w: Wreck, t: number, on: number, seed: number) => { const tail = w.car.NOSE - w.car.len, yaw = w.car.g.rotation.y, bxp = w.car.g.position; w.puffs.forEach((p, i) => { const u = (t * 0.9 + i / 4 + seed) % 1, d = tail - 0.3 - u * 2.2;
    p.position.set(bxp.x + Math.sin(yaw) * d, 0.45 + u * 1.3, bxp.z + Math.cos(yaw) * d); const s = 0.5 + u * 1.5; p.scale.set(s, s * 0.8, 1); (p.material as THREE.SpriteMaterial).opacity = on * 0.75 * (1 - u) * Math.min(1, u * 6); }); };
  const racePuff = mist(root, [0, -5, 0], 1.6, "#3e3a3c", 0);
  // chalk finish line (the smoke race), the newspaper, a hubcap, the tally counter, the ladder, sneakers + tag + boots, keys
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 5.8).rotateX(-Math.PI / 2), M("Chalk", "#f2ead6")); m.position.set(2, 0.007, 0); root.add(m); }
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.92), unlit(paperTex())); (paper.material as THREE.MeshBasicMaterial).side = THREE.DoubleSide; root.add(paper);
  const hubcap = new THREE.Mesh(cyl(0.21, 0.21, 0.03, 24).rotateX(Math.PI / 2), M("Hub", "#c8ccd4")); hubcap.castShadow = true; root.add(hubcap);
  const tally = new THREE.Group(); root.add(tally); { boxM(0.3, 0.2, 0.1, M("TallyBody", "#3a3f4a"), [0, 0, 0], tally); boxM(0.06, 0.06, 0.06, red, [0.12, 0.13, 0], tally); }
  const tallyD = [0, 1, 2, 3, 4, 5].map((k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.043, 0.1), unlit(digitTexW(0))); m.position.set(-0.11 + k * 0.044, 0, 0.052); tally.add(m); return m; });
  const ladder = new THREE.Group(); root.add(ladder); { const lx = 10.55; for (const sx of [-0.22, 0.22]) rod(ladder, [lx + sx, 0.14, -2.35], [lx + sx, 3.5, -3.3], 0.03, wood); for (let k = 0; k < 9; k++) rod(ladder, [lx - 0.22, 0.5 + k * 0.34, -2.45 - k * 0.097], [lx + 0.22, 0.5 + k * 0.34, -2.45 - k * 0.097], 0.022, wood); }
  for (const sx of [0, 0.2]) { boxM(0.17, 0.07, 0.09, M("Sneak", "#f4f1ea"), [MX.SHELF[0] - 0.1 + sx, 1.055, MX.SHELF[2] + 0.02]); boxM(0.08, 0.06, 0.09, M("Sneak2", "#3a6fc0"), [MX.SHELF[0] - 0.14 + sx, 1.11, MX.SHELF[2] + 0.02]); }
  const tag = new THREE.Group(); root.add(tag); sign(headTex("mondays", ["NOT ON", "MONDAYS"], "#c8352e", "#fff4d6", 256, 160), 0.24, 0.15, [0, -0.1, 0.01], 0, tag); rod(tag, [0, 0, 0], [0, -0.04, 0], 0.004, iron);
  const boots = new THREE.Group(); root.add(boots); for (const sx of [0, 0.2]) { boxM(0.12, 0.26, 0.12, M("Boot", "#6a4a2a"), [sx, 0.13, 0], boots); boxM(0.14, 0.08, 0.2, M("Boot2", "#5a3c20"), [sx, 0.04, 0.05], boots); boxM(0.1, 0.03, 0.1, M("Mud", "#4a3a2a"), [sx + 0.02, 0.1, 0.07], boots); }
  const keys = [0, 1, 2].map((k) => { const g = new THREE.Group(); g.position.set(2.41 + k * 0.24, 1.44, -5.13); root.add(g); const tg = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.13), unlit(headTex("kt" + k, [["5", "8", "?"][k]], ["#3f9a62", "#9a5226", "#6a5a4a"][k], "#fff4d6", 64, 84))); tg.position.set(0, -0.12, 0.012); g.add(tg); boxM(0.02, 0.09, 0.006, M("KeyM", "#d8c070"), [0, -0.03, 0.006], g); return g; });
  const marks: Record<string, V3> = { ...Object.fromEntries(Object.entries(MX).filter(([, v]) => typeof (v as V3)[0] === "number")) as Record<string, V3> };
  const cams = { street: { pos: [-1, 1.7, 9] as V3, look: [-3, 1.2, -3] as V3, fov: 52 }, port: { pos: [5.7, 1.5, -4.2] as V3, look: [5.2, 1.3, -9.3] as V3, fov: 52 }, av: { pos: [AX + 4, 1.6, -3.5] as V3, look: [AX - 3, 1.2, -4.2] as V3, fov: 52 },
    hall: { pos: [AX + 3, 5.6, -5.5] as V3, look: [AX + 4, 5.6, -10.5] as V3, fov: 52 }, yard: { pos: [AX + 6, 1.6, 2.5] as V3, look: [AX + 7, 1.5, 9] as V3, fov: 55 }, bridge: { pos: [AX + 30, 9, 2] as V3, look: [AX - 30, 2, -2] as V3, fov: 55 } };
  return {
    name: "mexset", root, marks, cams,
    pose: (t, c) => {
      // ---- home street ----
      const night = c.night ?? 0; lampG.material.opacity = night * 0.95; lampL.intensity = night * 46; bulbL.intensity = (c.bulb ?? 0) * 7; (bulb.material as THREE.SpriteMaterial).opacity = 0.25 + 0.7 * (c.bulb ?? 0);
      xmas.visible = (c.xmas ?? 0) > 0.01; bulbs.forEach((s, i) => { if (s && s.material) (s.material as THREE.SpriteMaterial).opacity = (c.xmas ?? 0) * (0.75 + 0.25 * Math.sin(t * 3 + i * 1.7)); });
      gate.rotation.y = -(c.gate ?? 0) * 1.2;
      green.g.visible = (c.greenVis ?? 1) > 0.5; place(green, MX.GREEN[0], MX.GREEN[2], Math.PI / 2); green.set({ t, door: c.greenDoor ?? 0 });
      // Hugo's car: hugoX along the road heading -x (driver's side toward +z); parked when hugoPark = 1
      { const hx = c.hugoX ?? 999; hugoCar.g.visible = hx < 900; if (hx < 900) { place(hugoCar, hx, c.hugoZ ?? 0.9, -Math.PI / 2 + (c.hugoYaw ?? 0)); hugoCar.set({ t, dist: -hx, bob: c.hugoBob ?? 0.15 }); } }
      // the rusty car: rustX/rustZ/rustYaw (nose +x), rustBob, rustDoor, smoke rustSmoke
      { const rx = c.rustX ?? 999; rust.car.g.visible = rx < 900; if (rx < 900) { place(rust.car, rx, c.rustZ ?? -2.05, Math.PI / 2 + (c.rustYaw ?? 0)); rust.car.set({ t, dist: rx, bob: c.rustBob ?? 0, shake: c.rustShake ?? 0, door: c.rustDoor ?? 0 }); }
        exhaust(rust, t, rx < 900 ? (c.rustSmoke ?? 0) : 0, 0); }
      // four neighbour wrecks: w{k}X, w{k}Z, w{k}Yaw (0 = nose +x), w{k}Smoke, w{k}Door
      wrecks.forEach((w, k) => { const x = c["w" + k + "X"] ?? 999; w.car.g.visible = x < 900; if (x < 900) { place(w.car, x, c["w" + k + "Z"] ?? 2.05, Math.PI / 2 + (c["w" + k + "Yaw"] ?? 0)); w.car.set({ t, dist: x, bob: c["w" + k + "Bob"] ?? 0, door: c["w" + k + "Door"] ?? 0 }); } exhaust(w, t, x < 900 ? (c["w" + k + "Smoke"] ?? 0) : 0, k * 0.37); });
      { const k = c.race ?? -1; (racePuff.material as THREE.SpriteMaterial).opacity = k >= 0 ? 0.85 : 0; if (k >= 0) { racePuff.position.set(c.raceX ?? 0, 0.75 + 0.12 * Math.sin(t * 9), c.raceZ ?? 0.9); const s = 1.5 + 0.2 * Math.sin(t * 7); racePuff.scale.set(s, s * 0.8, 1); } }
      kerbB.visible = kerbW.visible = (c.kerbCars ?? 1) > 0.5;
      { paper.visible = (c.paper ?? 0) > 0; paper.position.set(c.paperX ?? 0, c.paperY ?? -5, c.paperZ ?? 0); paper.rotation.set(-0.15, c.paperRY ?? 0, 0); paper.scale.x = 0.5 + 0.5 * sm(c.paper ?? 0); }
      { hubcap.visible = (c.hub ?? 0) > 0; hubcap.position.set(c.hubX ?? 0, c.hubY ?? 0.21, c.hubZ ?? 0); hubcap.rotation.set(c.hubTip ?? 0, 0, -(c.hubRoll ?? 0)); }
      { tally.visible = (c.tc ?? 0) > 0; tally.position.set(c.tcX ?? 0, c.tcY ?? -5, c.tcZ ?? 0); tally.rotation.y = c.tcRY ?? 0; const n = Math.round(c.tcN ?? 0); tallyD.forEach((m, k) => { const d = Math.floor(n / 10 ** (5 - k)) % 10, mt = m.material as THREE.MeshBasicMaterial, tx = digitTexW(d); if (mt.map !== tx) { mt.map = tx; mt.needsUpdate = true; } }); }
      ladder.visible = (c.ladder ?? 0) > 0.5;
      { tag.visible = (c.tag ?? 0) > 0; tag.position.set(c.tagX ?? MX.SHELF[0], c.tagY ?? 1.0, c.tagZ ?? MX.SHELF[2] + 0.13); }
      { boots.visible = (c.boots ?? 0) > 0.5; boots.position.set(c.bootX ?? 1.95, c.bootY ?? 0.3, c.bootZ ?? -4.7); }
      keys.forEach((g, k) => { g.visible = (c["key" + k] ?? (k < 2 ? 1 : 0)) > 0.5; });
      // toy cars on the week board
      toys.forEach((g, k) => { const p = toyAt(k, c["toy" + k] ?? 0); g.position.set(p[0], p[1], p[2]); g.rotation.y = 0; });
      // SAT plate under the rule sign: sat 0 = hidden, 0..1 = lifted into place from the worker's hands
      { const s = c.sat ?? 0; satPlate.visible = s > 0; satPlate.position.set(c.satX ?? MX.RULE[0] + 1.3, c.satY ?? 3.12, c.satZ ?? MX.RULE[2] + 0.04); }
      // ---- avenue ----
      bar.rotation.x = -(1 - (c.bar ?? 1)) * 1.25;                                       // 0 = raised, 1 = down across the lanes
      tiles.forEach((m, k) => { const u = cl((c.tiles ?? 5) - k); m.visible = u > 0; m.position.y = MX.TILES[1] + 1.0 - k * 0.6 + (1 - sm(u)) * 0.3; m.position.z = MX.TILES[2] + 0.09 + (1 - sm(u)) * 0.5; });
      flags.forEach((m, i) => { const P = m.geometry.attributes.position as THREE.BufferAttribute; for (let j = 0; j < P.count; j++) P.setZ(j, Math.sin(P.getX(j) * 4 + t * 4 + i) * 0.07 * (P.getX(j) + 0.75)); P.needsUpdate = true; });
      needle.rotation.z = -1.05 + (c.air ?? 0) * 0.5 + Math.sin(t * 5) * 0.03 * (c.airJit ?? 1);
      banner.scale.y = Math.max(0.02, c.banner ?? 0); banner.visible = (c.banner ?? 0) > 0.01;
      { const n = Math.round(c.count ?? 0), roll = (c.count ?? 0) - Math.floor(c.count ?? 0); digits.forEach((m, k) => { const d = Math.floor(n / 10 ** k) % 10; const mt = m.material as THREE.MeshBasicMaterial; const tx = digitTex(d); if (mt.map !== tx) { mt.map = tx; mt.needsUpdate = true; } m.scale.y = 1 - 0.25 * Math.sin(Math.PI * roll) * (k === 0 ? 1 : 0); }); crank.rotation.z = -(c.count ?? 0) * 0.9; }
      place(greenAv, MX.MEMOAV[0], MX.MEMOAV[2], Math.PI / 2); greenAv.g.visible = (c.avMemo ?? 0) > 0.5; greenAv.set({ t, shake: c.avShake ?? 0, bob: 0.12 });
      avNear.forEach((car, k) => { const P: [number, number][] = [[AX - 3.6, -6.4], [AX - 8.6, -3.8], [AX - 9.2, -6.4], [AX - 3.9, -1.3]]; car.g.visible = (c.avNear ?? 0) > 0.5; place(car, P[k][0] - (1 - sm(c.jam ?? 1)) * (10 + k * 6), P[k][1], Math.PI / 2); car.set({ t, bob: 0.1 }); });
      place(stopped, MX.STOPPED[0], MX.STOPPED[2], Math.PI / 2); stopped.g.visible = (c.yard ?? 0) > 0.5; stopped.set({ t });
      { const tw = sm(c.tow ?? 0); towed.g.visible = (c.yard ?? 0) > 0.5; towed.g.position.set(MX.TOWED[0], 0, MX.TOWED[2]); towed.g.rotation.set(0, -Math.PI / 2, 0); towed.g.rotation.x = 0; towed.g.rotateX(-tw * 0.26); towed.g.position.y = tw * 0.05;
        truck.visible = (c.yard ?? 0) > 0.5; hook.visible = truck.visible; hook.position.set(MX.TOW[0] + 2.75, 2.85 - (1 - tw) * 0.9 + 0.3, MX.TOW[2]); }
      // the fleet: jam 0 = sparse and far back, 1 = packed bumper to bumper; fleet = -1 hides it; hole = cars removed round the checkpoint
      { const jam = c.jam ?? 1, dens = c.dens ?? 1, vis = (c.fleet ?? 1) > 0; fleetB.visible = fleetW.visible = vis; if (vis) { let i = 0;
          for (let r = 0; r < ROWS; r++) for (let l = 0; l < LANES.length; l++, i++) { const h = hash(i, 1), x0 = AX - 14 - r * 5.3 + (c.fleetX ?? 0) + (l % 2) * 1.1; const show = h < dens && !((c.hole ?? 1) > 0.5 && x0 > AX - 13 && LANES[l] < 0);
            const x = x0 - (1 - sm(cl(jam * 1.4 - h * 0.4))) * (40 + h * 60) + ((c.creep ?? 0) * (0.6 + h)) % 2.2; dm.position.set(x, show ? 0 : -30, LANES[l] + (hash(i, 6) - 0.5) * 0.3); dm.rotation.set(0, 0, 0); dm.scale.setScalar(1); dm.updateMatrix(); fleetB.setMatrixAt(i, dm.matrix); fleetW.setMatrixAt(i, dm.matrix); }
          fleetB.instanceMatrix.needsUpdate = true; fleetW.instanceMatrix.needsUpdate = true; } }
      smog.forEach((s, k) => { (s.material as THREE.SpriteMaterial).opacity = ((c.smogOrd ?? 0) > 0 && k >= 5 ? 0 : 1) * (c.smog ?? 0) * (0.2 + 0.1 * Math.sin(t * 0.3 + k)); s.position.x = AX - 90 + k * 26 + Math.sin(t * 0.1 + k) * 4; });
      void smoked; void TAU;
    },
  };
};
