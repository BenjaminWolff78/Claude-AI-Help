// "They Put a Plague in One Room and It Took a Whole City" (2026-11-18): an ORIGINAL fantasy online-game world (no real
// game's characters, logos, map or interface). Local metres, y up. Four areas in one set:
//  MARKET SQUARE (x -16..16, z -10..10, cobbles y 0): timber-framed stone houses on the north (fronts z -10, facing +z) and
//    south (fronts z 10, facing -z) and east (fronts x 16, facing -x); the west side opens into the GATE STREET (z -3..3)
//    that runs to the CITY GATE at x -28 (arch x -28, two round towers at z -4.2 / 4.2) and the WOODS beyond (x < -31).
//    In the square: the round fountain (0, 0, 1.5), BRAM'S BREAD STALL (x -6.5, z -7.2, counter top 1.0, faces +z), the
//    fruit stall (x 6.5, z -7.2), the potion stall (x 7.5, z 7.2, faces -z), the NOTICE BOARD with the city map (x -11.5,
//    z -9.4), lamp posts, barrels, crates, banners, flower boxes, a well-worn cart. The QUARANTINE RING (c.qRing) glows
//    around (3.5, 0, 3.0).
//  BOSS CHAMBER (x 74..86, z -8..6, ceiling 7.5): dark stone hall, red torches, pillars, the ALTAR (80, 0, -5.6) with the
//    red curse ORB, the heavy DOOR at z 6 (x 79..81) with the glowing rune barrier; red MIST (c.mist 0..1) seeps under it.
//  THE OFFICE (x 156..164, z -5..4): desks, monitors with the city map (c.mapRed 0..1 shared with the notice board),
//    the server rack with the big RESTART lever (c.lever 0..1, c.blink), the wall REWIND DIAL (c.rewind turns), the code
//    printout on the desk.
//  THE STUDY (x 236..244, z -4..3): the chalkboard with the infection curve (c.curve 0..1), a desk with journals, the
//    pinned city map, bookshelves, a window.
import * as THREE from "three";
import { Batch, V, lam, quad } from "../build";
import { ctex, rng, rep, stoneHD, roofHD, planksHD } from "../paint";
import { NOINK } from "../ink";
import { swayMaterial } from "../sway";
import { barkTex, leafyTree, leafCardMat } from "./brickyard";
import type { SetDef, V3 } from "./types";

const TAU = Math.PI * 2;
const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
const M = (key: string, color: string, map?: THREE.Texture, extra: THREE.MeshLambertMaterialParameters = {}) => lam("pt" + key, () => ({ color, ...(map ? { map } : {}), ...extra }));
const unlit = (map: THREE.Texture, k = 0.9) => new THREE.MeshBasicMaterial({ map, color: new THREE.Color(k, k, k), toneMapped: true });
const bx = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (r0: number, r1: number, h: number, n = 28) => new THREE.CylinderGeometry(r0, r1, h, n);

export const PT = {
  FOUNT: [0, 0, 1.5] as V3, BREAD: [-6.5, 0, -7.2] as V3, BRAM: [-6.5, 0, -8.05] as V3, FRUIT: [6.5, 0, -7.2] as V3, POTION: [7.5, 0, 7.2] as V3,
  BOARD: [-11.5, 1.7, -9.4] as V3, QRING: [3.5, 0, 3.0] as V3, GATE: [-28, 0, 0] as V3,
  BOSS: [80, 0, -5.0] as V3, ORB: [80, 1.55, -5.6] as V3, DOOR: [80, 0, 6] as V3,
  OFFICE: [160, 0, 0] as V3, DESK: [158.6, 0.78, -2.6] as V3, RACK: [162.6, 0, -4.4] as V3, DIAL: [160, 2.2, -4.92] as V3,
  STUDY: [240, 0, 0] as V3, CHALK: [240, 1.6, -3.92] as V3,
};

// ---------------- textures ----------------
const cobble = () => ctex("ptCobble", 1024, 1024, (g, r) => { g.fillStyle = "#6e665c"; g.fillRect(0, 0, 1024, 1024);
  for (let y = 0; y < 1024; y += 40) for (let x = -(y % 80 ? 20 : 0); x < 1024; x += 44) { const v = 120 + (r() - 0.5) * 50, w = 36 + r() * 6, h = 32 + r() * 6;
    g.fillStyle = `rgb(${v + 10},${v + 2},${v - 10})`; g.beginPath(); g.ellipse(x + 22, y + 20, w / 2, h / 2, r() * 0.4, 0, TAU); g.fill();
    g.fillStyle = "rgba(255,255,255,0.12)"; g.beginPath(); g.ellipse(x + 18, y + 14, w / 4, h / 5, 0, 0, TAU); g.fill(); }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(40,34,28,${0.08 + r() * 0.1})`; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 40 + r() * 80, 20 + r() * 40, r() * 3, 0, TAU); g.fill(); } });
const halfTimber = (key: string, plaster: string, wood: string, wm: number, hm: number, seed: number) => ctex("ptHT" + key, Math.round(wm * 64), Math.round(hm * 64), (g, r) => {
  const W = wm * 64, H = hm * 64, m = (v: number) => v * 64; g.fillStyle = "#8a7a68"; g.fillRect(0, 0, W, m(1.2));   // stone plinth
  for (let x = 0; x < W; x += m(0.5)) for (let y = 0; y < m(1.2); y += m(0.3)) { const v = 120 + r() * 40; g.fillStyle = `rgb(${v},${v - 8},${v - 18})`; g.fillRect(x + 2, y + 2 + ((x / m(0.5)) % 2) * 6, m(0.5) - 4, m(0.3) - 4); }
  g.fillStyle = plaster; g.fillRect(0, m(1.2), W, H - m(1.2));
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "255,255,240" : "90,70,50"},${0.04 + r() * 0.05})`; g.beginPath(); g.ellipse(r() * W, m(1.2) + r() * (H - m(1.2)), 20 + r() * 60, 10 + r() * 30, 0, 0, TAU); g.fill(); }
  g.fillStyle = wood; const beam = m(0.18);
  for (const y of [m(1.2), m(3.0), H - beam]) g.fillRect(0, y, W, beam);
  for (let x = 0; x <= W; x += m(1.6)) g.fillRect(Math.min(W - beam, x), m(1.2), beam, H - m(1.2));
  g.strokeStyle = wood; g.lineWidth = beam * 0.8; const rr = rng(seed);
  for (let x = 0; x < W - m(1.6); x += m(1.6)) { if (rr() < 0.5) { g.beginPath(); g.moveTo(x, m(3.0)); g.lineTo(x + m(1.6), H); g.stroke(); } else { g.beginPath(); g.moveTo(x + m(1.6), m(3.0)); g.lineTo(x, H); g.stroke(); } }
  g.fillStyle = "rgba(0,0,0,0.25)"; for (const y of [m(1.38), m(3.18)]) g.fillRect(0, y, W, 4); });
const rockWall = (key: string, base: string) => ctex("ptRock" + key, 1024, 1024, (g, r) => { g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
  for (let y = 0; y < 1024; y += 96) for (let x = -(y % 192 ? 70 : 0); x < 1024; x += 140) { const v = (r() - 0.5) * 30; g.fillStyle = `rgba(${90 + v},${80 + v},${80 + v},0.55)`; g.fillRect(x + 4, y + 4, 132, 88);
    g.fillStyle = "rgba(255,255,255,0.06)"; g.fillRect(x + 8, y + 8, 120, 10); g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(x + 4, y + 86, 132, 6); }
  for (let i = 0; i < 30; i++) { g.strokeStyle = "rgba(20,10,10,0.3)"; g.lineWidth = 2; g.beginPath(); let x = r() * 1024, y = r() * 1024; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 60; y += r() * 40; g.lineTo(x, y); } g.stroke(); } });
const runeTex = () => ctex("ptRune", 256, 512, (g, r) => { g.clearRect(0, 0, 256, 512); g.strokeStyle = "rgba(255,90,70,0.95)"; g.lineWidth = 7; g.shadowColor = "#ff3020"; g.shadowBlur = 18;
  g.strokeRect(14, 14, 228, 484); for (let i = 0; i < 6; i++) { const y = 60 + i * 76; g.beginPath(); g.arc(128, y, 22, 0, TAU); g.moveTo(106, y); g.lineTo(150, y); g.moveTo(128, y - 22); g.lineTo(128 + (r() - 0.5) * 30, y + 22); g.stroke(); } });
const mistTex = () => ctex("ptMist", 256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, "rgba(220,40,40,0.75)"); gr.addColorStop(0.6, "rgba(160,20,30,0.3)"); gr.addColorStop(1, "rgba(120,0,20,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
/** the city map: districts that turn red with k (shared by the notice board and the office monitors) */
const mapTex = (k: number, monitor: boolean, q = 0, ph = 0) => ctex("ptMap" + (monitor ? "M" : "B") + Math.round(k * 10) + "q" + Math.round(q * 4) + "p" + ph, 512, 384, (g, r) => {
  g.fillStyle = monitor ? "#12202a" : "#e8d8b0"; g.fillRect(0, 0, 512, 384);
  const cells: [number, number, number, number][] = []; const rr = rng(77); for (let y = 0; y < 6; y++) for (let x = 0; x < 8; x++) cells.push([30 + x * 57 + rr() * 6, 30 + y * 54 + rr() * 6, 48 + rr() * 6, 44 + rr() * 6]);
  const cx = 220, cy = 190; const order = cells.map((c, i) => [Math.hypot(c[0] - cx, c[1] - cy), i]).sort((a, b) => a[0] - b[0]);
  const red = new Set(order.slice(0, Math.round(k * cells.length)).map((o) => o[1]));
  cells.forEach((c, i) => { g.fillStyle = red.has(i) ? "#d8352e" : monitor ? "#3a6a5a" : "#b8c890"; g.fillRect(c[0], c[1], c[2], c[3]); g.strokeStyle = monitor ? "#8adcc8" : "#6a5a3a"; g.lineWidth = 2; g.strokeRect(c[0], c[1], c[2], c[3]); });
  g.strokeStyle = monitor ? "#8adcc8" : "#4a6aa0"; g.lineWidth = 8; g.beginPath(); g.moveTo(0, 210); g.bezierCurveTo(150, 180, 300, 260, 512, 200); g.stroke();
  if (q > 0) { g.strokeStyle = "#7ae8f0"; g.lineWidth = 10; g.setLineDash([18, 10]); g.beginPath(); g.arc(cx, cy, 70 * Math.min(1, q * 1.5), 0, TAU); g.stroke(); g.setLineDash([]);
    if (q > 0.5) for (let i = 0; i < 9; i++) { const a = ((ph / 12) + i / 9) * TAU, rr2 = 86 + 6 * Math.sin(i * 3); g.fillStyle = "#ff4a3a"; g.beginPath(); g.arc(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2, 9, 0, TAU); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 2; g.stroke(); } }
  g.fillStyle = monitor ? "#8adcc8" : "#3a2a1a"; g.font = "900 30px Georgia"; g.textAlign = "center"; g.fillText(monitor ? "SERVER 1 - CAPITAL" : "THE CAPITAL", 256, 372); void r; });
const curveTex = (k: number) => ctex("ptCurve" + Math.round(k * 12), 768, 448, (g) => { g.fillStyle = "#24352c"; g.fillRect(0, 0, 768, 448);
  g.strokeStyle = "rgba(240,240,230,0.8)"; g.lineWidth = 5; g.beginPath(); g.moveTo(60, 40); g.lineTo(60, 400); g.lineTo(740, 400); g.stroke();
  g.strokeStyle = "#f2a8a0"; g.lineWidth = 8; g.beginPath(); const n = Math.round(k * 60); for (let i = 0; i <= n; i++) { const x = 60 + i * 11, t = i / 60, y = 400 - 330 * Math.exp(-Math.pow((t - 0.45) / 0.16, 2)); if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
  g.fillStyle = "rgba(240,240,230,0.85)"; g.font = "700 34px Georgia"; g.fillText("cases", 76, 70); g.fillText("days", 640, 436); });
const dialTex = () => ctex("ptDial", 512, 512, (g) => { g.fillStyle = "#f2ead6"; g.beginPath(); g.arc(256, 256, 250, 0, TAU); g.fill(); g.strokeStyle = "#3a2a1a"; g.lineWidth = 14; g.stroke();
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i * TAU) / 7; g.fillStyle = "#3a2a1a"; g.font = "900 40px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][i], 256 + Math.cos(a) * 180, 256 + Math.sin(a) * 180); }
  g.fillStyle = "#c8352e"; g.font = "900 46px Arial Black"; g.fillText("REWIND", 256, 330); });
const bannerTex = (key: string, a: string, b: string) => ctex("ptBan" + key, 128, 384, (g) => { g.fillStyle = a; g.fillRect(0, 0, 128, 384); g.fillStyle = b; g.fillRect(0, 40, 128, 18); g.fillRect(0, 300, 128, 18);
  g.beginPath(); g.moveTo(64, 120); g.lineTo(100, 180); g.lineTo(64, 240); g.lineTo(28, 180); g.closePath(); g.fill(); g.clearRect(0, 360, 128, 24); g.fillStyle = a; g.beginPath(); g.moveTo(0, 360); g.lineTo(64, 384); g.lineTo(128, 360); g.fill(); });
const signTex = (key: string, txt: string, bg: string, fg: string) => ctex("ptSign" + key, 512, 160, (g) => { g.fillStyle = bg; g.fillRect(0, 0, 512, 160); g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(8, 8, 496, 144);
  g.fillStyle = fg; g.font = "900 70px Georgia"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 256, 84); });
const screenTex = (key: string, col: string) => ctex("ptScr" + key, 256, 160, (g, r) => { g.fillStyle = "#0e1a22"; g.fillRect(0, 0, 256, 160); for (let i = 0; i < 12; i++) { g.fillStyle = col; g.fillRect(14 + (i % 2) * 12, 12 + i * 12, 40 + r() * 160, 5); } });

export const plaguetown = (): SetDef => {
  const root = new THREE.Group(), b = new Batch(), nc = new Batch(), bc = new Batch();
  const flames: THREE.Mesh[] = [], sway: THREE.Mesh[] = [];
  // ======================= MARKET SQUARE =======================
  const ground = M("Cobble", "#ffffff", rep(cobble(), 10, 10));
  b.add(quad(V(-46, 0, 12), V(18, 0, 12), V(18, 0, -12), V(-46, 0, -12), 1, 1), ground);
  b.add(quad(V(-90, -0.02, 60), V(30, -0.02, 60), V(30, -0.02, -60), V(-90, -0.02, -60), 1, 1), M("Grass", "#6e9450"));
  const plasters = ["#efe2c4", "#e8d2b0", "#f0e6cc", "#e2cfae", "#efdcc0"], woods = ["#5a3a24", "#4a3020", "#6a4228"];
  const roofs = [M("RoofA", "#ffffff", roofHD("#8a4a34")), M("RoofB", "#ffffff", roofHD("#5a5a68", true)), M("RoofC", "#ffffff", roofHD("#9a5a3a"))];
  const sideM = M("Side", "#ffffff", rep(stoneHD("ptSideStone", ["#c8b89a", "#bfae90", "#d0c2a6", "#b8a888"], "#8a7a64"), 2, 2));
  const house = (x0: number, x1: number, zf: number, dir: 1 | -1, h: number, i: number) => {
    const w = x1 - x0, cx = (x0 + x1) / 2, depth = 7, fac = M("Fac" + i, "#ffffff", halfTimber("f" + i, plasters[i % 5], woods[i % 3], w, h, 30 + i));
    const zb = zf - dir * depth;
    if (dir > 0) b.add(quad(V(x0, 0, zf), V(x1, 0, zf), V(x1, h, zf), V(x0, h, zf), 1, 1), fac); else b.add(quad(V(x1, 0, zf), V(x0, 0, zf), V(x0, h, zf), V(x1, h, zf), 1, 1), fac);
    nc.add(bx(w, h, depth).translate(cx, h / 2, (zf + zb) / 2 - dir * 0.01), sideM);
    const ov = 0.45, z0 = zf + dir * ov, z1 = zb - dir * ov, zm = (z0 + z1) / 2, rh = 2.8, rm = roofs[i % 3];
    const A = V(x0 - ov, h, z0), B2 = V(x1 + ov, h, z0), C = V(x1 + ov, h + rh, zm), D = V(x0 - ov, h + rh, zm);
    if (dir > 0) { b.add(quad(A, B2, C, D, 3, 1), rm); b.add(quad(V(x1 + ov, h, z1), V(x0 - ov, h, z1), D, C, 3, 1), rm); }
    else { b.add(quad(B2, A, D, C, 3, 1), rm); b.add(quad(V(x0 - ov, h, z1), V(x1 + ov, h, z1), C, D, 3, 1), rm); }
    for (const xs of [x0, x1]) { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([xs, h, zf, xs, h, zb, xs, h + rh - 0.1, (zf + zb) / 2], 3)); g.computeVertexNormals(); nc.add(g, sideM); }
    nc.add(bx(0.6, 1.3, 0.6).translate(x0 + w * 0.7, h + rh - 0.2, zm), M("Chimney", "#8a6a54"));
    // door, windows with shutters and flower boxes, a hanging shop sign on some
    const doorM = M("Door" + (i % 3), ["#5a3a24", "#2f5a4a", "#6a2a2a"][i % 3]), glassM = M("Win", "#3a4a5a", undefined, { emissive: "#2a2014" }), shM = M("Shut" + (i % 4), ["#3f6a5a", "#7a3a3a", "#3a5a8a", "#8a6a2a"][i % 4]);
    const zz = zf + dir * 0.04;
    b.add(bx(1.1, 2.1, 0.08).translate(cx + (i % 2 ? -w * 0.25 : w * 0.22), 1.05, zz), doorM);
    for (const fx of [-0.3, 0.3]) for (const fy of [1.9, 3.9]) { if (fy < 2.5 && Math.abs(fx - (i % 2 ? -0.25 : 0.22)) < 0.2) continue; if (fy > h - 1) continue;
      const wx = cx + fx * w; b.add(bx(0.9, 1.1, 0.06).translate(wx, fy, zz), glassM); b.add(bx(0.06, 1.1, 0.08).translate(wx, fy, zz + dir * 0.01), M("Mull", "#4a3020")); b.add(bx(0.9, 0.06, 0.08).translate(wx, fy, zz + dir * 0.01), M("Mull", "#4a3020"));
      for (const s of [-1, 1]) b.add(bx(0.42, 1.12, 0.05).translate(wx + s * 0.68, fy, zz + dir * 0.02), shM);
      b.add(bx(1.0, 0.2, 0.26).translate(wx, fy - 0.66, zf + dir * 0.13), M("Box", "#5a3a24"));
      const r = rng(i * 11 + Math.round(fx * 10) + fy); for (let k = 0; k < 7; k++) b.add(new THREE.IcosahedronGeometry(0.08 + r() * 0.05, 1).translate(wx - 0.4 + k * 0.13, fy - 0.5, zf + dir * 0.15), M("Fl" + (k % 4), ["#e8484a", "#f4c040", "#f2f0ea", "#d86ab0"][k % 4])); }
  };
  [[-16, -10.5, 7.2], [-10.5, -4, 8.0], [-4, 2, 7.0], [2, 9, 8.4], [9, 16, 7.4]].forEach(([a, c, h], i) => house(a, c, -10, 1, h, i));
  [[-16, -9, 7.6], [-9, -3, 7.0], [-3, 4, 8.2], [4, 10, 7.2], [10, 16, 7.8]].forEach(([a, c, h], i) => house(a, c, 10, -1, h, i + 5));
  // gate street houses (both sides) and the back row (the skyline)
  [[-28, -22, 6.6], [-22, -16, 7.2]].forEach(([a, c, h], i) => house(a, c, -4.2, 1, h, i + 10));
  [[-28, -22, 7.0], [-22, -16, 6.4]].forEach(([a, c, h], i) => house(a, c, 4.2, -1, h, i + 12));
  // east side: a big hall facing -x (the guild hall) with a tower
  { const hall = M("Hall", "#ffffff", halfTimber("hall", "#e8dcc0", "#4a3020", 20, 9, 91)); b.add(quad(V(16, 0, -10), V(16, 0, 10), V(16, 9, 10), V(16, 9, -10), 1, 1), hall); nc.add(bx(8, 9, 20).translate(20, 4.5, 0), sideM);
    b.add(quad(V(15.6, 9, -10.4), V(15.6, 9, 10.4), V(20, 12.5, 10.4), V(20, 12.5, -10.4), 4, 1), roofs[1]);
    nc.add(cyl(2.0, 2.0, 16, 32).translate(18, 8, -6), sideM); b.add(new THREE.ConeGeometry(2.5, 4, 32).translate(18, 18, -6), roofs[0]);
    b.add(bx(0.06, 2.6, 1.8).translate(15.97, 1.3, 0), M("Door0", "#5a3a24")); const gs = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.0), unlit(signTex("guild", "GUILD HALL", "#2f3a5a", "#f2c94c"))); gs.position.set(15.9, 4.0, 0); gs.rotation.y = -Math.PI / 2; root.add(gs); }
  // fountain (48 segments): basin, rim, pillar, bowl, water
  { const st = M("FountStone", "#ffffff", rep(stoneHD("ptFount", ["#d8ccb4", "#cfc2a8", "#e0d4bc", "#c8baa0"], "#9a8c74"), 3, 1)), wat = M("Water", "#5a9ab8", undefined, { emissive: "#0a2a3a" });
    const [x, , z] = PT.FOUNT; b.add(cyl(2.4, 2.5, 0.7, 48).translate(x, 0.35, z), st); b.add(cyl(2.15, 2.15, 0.05, 48).translate(x, 0.6, z), wat);
    b.add(cyl(0.35, 0.45, 1.8, 32).translate(x, 1.2, z), st); b.add(cyl(1.0, 0.4, 0.4, 48).translate(x, 2.1, z), st); b.add(cyl(0.9, 0.9, 0.04, 48).translate(x, 2.28, z), wat);
    b.add(new THREE.SphereGeometry(0.28, 32, 16).translate(x, 2.55, z), st); }
  // stalls: striped awnings on four posts, counter, goods
  const stall = (p: V3, dir: 1 | -1, a: string, bb: string, key: string, goods: (cx: number, cy: number, cz: number) => void, label: string) => {
    const [x, , z] = p; const post = M("StallPost", "#6a4a32"), cnt = M("Counter", "#ffffff", rep(planksHD(), 0.5, 0.3));
    for (const sx of [-1.4, 1.4]) for (const sz of [-0.6, 0.6]) b.add(cyl(0.06, 0.06, 2.6, 16).translate(x + sx, 1.3, z + sz), post);
    b.add(bx(3.0, 0.85, 1.1).translate(x, 0.425, z), cnt);
    const aw = ctex("ptAwn" + key, 256, 64, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? a : bb; g.fillRect(i * 32, 0, 32, 64); } });
    const awn = M("Awn" + key, "#ffffff", aw, { side: THREE.DoubleSide }); b.add(quad(V(x - 1.6, 2.7, z - dir * 0.8), V(x + 1.6, 2.7, z - dir * 0.8), V(x + 1.6, 2.3, z + dir * 1.0), V(x - 1.6, 2.3, z + dir * 1.0), 1, 1), awn);
    for (let i = 0; i < 8; i++) b.add(new THREE.ConeGeometry(0.2, 0.25, 3).rotateX(Math.PI).translate(x - 1.4 + i * 0.4, 2.18, z + dir * 1.0), M("AwnT" + (i % 2), i % 2 ? a : bb));
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.56), unlit(signTex(key, label, "#f2e2b8", "#5a3a24"))); sg.position.set(x, 2.95, z + dir * 0.82); if (dir < 0) sg.rotation.y = Math.PI; root.add(sg);
    goods(x, 0.85, z);
  };
  const breadM = M("Loaf", "#d9a253"), crustM = M("Crust", "#8a5224");
  stall(PT.BREAD, 1, "#c8352e", "#f2e8d2", "bread", (x, y, z) => { const r = rng(5); for (let k = 0; k < 6; k++) { const bx0 = x - 1.25 + k * 0.5; b.add(new THREE.CapsuleGeometry(0.07, 0.42, 8, 20).rotateZ(Math.PI / 2).rotateY(0.15 * (k % 2 ? 1 : -1)).translate(bx0, y + 0.08, z - 0.25), breadM); for (let c2 = 0; c2 < 4; c2++) b.add(bx(0.015, 0.02, 0.1).rotateY(0.6).translate(bx0 - 0.15 + c2 * 0.1, y + 0.145, z - 0.25), crustM); }
    for (let k = 0; k < 5; k++) { const bx0 = x - 1.0 + k * 0.5; b.add(new THREE.SphereGeometry(0.15, 24, 14).scale(1.15, 0.7, 1.0).translate(bx0, y + 0.1, z + 0.15), breadM); b.add(bx(0.2, 0.02, 0.02).translate(bx0, y + 0.2, z + 0.15), crustM); } void r; }, "BREAD");
  stall(PT.FRUIT, 1, "#3a7a4a", "#f2e8d2", "fruit", (x, y, z) => { const cols = ["#d63a2e", "#f4a024", "#e8d040", "#6aa64e", "#8a3a8a"]; const r = rng(9); for (let k = 0; k < 36; k++) b.add(new THREE.SphereGeometry(0.09, 16, 10).translate(x - 1.25 + (k % 12) * 0.22, y + 0.09 + 0.04 * Math.floor(k / 12), z - 0.3 + Math.floor(k / 12) * 0.28 + r() * 0.04), M("Fruit" + (k % 5), cols[k % 5])); }, "FRUIT");
  stall(PT.POTION, -1, "#4a3a8a", "#e8d8f0", "potion", (x, y, z) => { const cols = ["#d8352e", "#3a9ad8", "#4ad86a", "#c87ae8"]; for (let k = 0; k < 10; k++) { const px = x - 1.2 + k * 0.27; b.add(new THREE.SphereGeometry(0.1, 20, 12).translate(px, y + 0.12, z), M("Pot" + (k % 4), cols[k % 4], undefined, { emissive: "#201018" })); b.add(cyl(0.03, 0.03, 0.12, 12).translate(px, y + 0.26, z), M("Neck", "#d8e0e4")); } }, "POTIONS");
  // notice board with the city map (the map is a live texture)
  const boardMat = unlit(mapTex(0, false), 0.95);
  { const [x, y, z] = PT.BOARD; b.add(bx(2.4, 1.9, 0.12).translate(x, y, z), M("BoardWood", "#6a4a32")); for (const s of [-1.1, 1.1]) b.add(cyl(0.07, 0.07, 2.9, 16).translate(x + s, 1.45, z), M("StallPost", "#6a4a32"));
    b.add(new THREE.ConeGeometry(1.7, 0.6, 4).rotateY(Math.PI / 4).scale(1, 1, 0.3).translate(x, y + 1.25, z), roofs[0]);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.58), boardMat); m.position.set(x, y, z + 0.07); m.layers.set(NOINK); root.add(m); }
  // lamp posts, barrels, crates, a cart, banners, benches
  const iron = M("Iron", "#2e3238"), lampG = M("LampG", "#f2d890", undefined, { emissive: "#6a5020" });
  for (const [x, z] of [[-13, -6], [12.5, -6], [-13, 6.5], [12.5, 6.5], [-20, -2.6], [-24, 2.6]] as [number, number][]) { b.add(cyl(0.06, 0.1, 3.6, 16).translate(x, 1.8, z), iron); b.add(new THREE.ConeGeometry(0.28, 0.3, 6).translate(x, 3.95, z), iron); b.add(cyl(0.18, 0.22, 0.4, 6).translate(x, 3.6, z), lampG); }
  const barrelM = M("Barrel", "#ffffff", rep(planksHD(), 0.4, 0.6)), hoopM = M("Hoop", "#3a3a40");
  for (const [x, z] of [[-9.2, -8.6], [-8.6, -8.9], [9.3, -8.6], [11.0, 8.4], [-14.2, 8.6], [-14.6, 7.8], [4.6, 8.8]] as [number, number][]) { b.add(cyl(0.34, 0.34, 0.9, 28).scale(1, 1, 1).translate(x, 0.45, z), barrelM); for (const y of [0.18, 0.72]) b.add(cyl(0.355, 0.355, 0.05, 28).translate(x, y, z), hoopM); }
  for (const [x, z, s] of [[-4.0, -8.8, 0.6], [-3.4, -8.9, 0.5], [3.8, -8.7, 0.55], [13.6, 8.6, 0.6]] as number[][]) b.add(bx(s, s, s).translate(x, s / 2, z), M("Crate", "#ffffff", rep(planksHD(), 0.3, 0.3)));
  { const cartM = M("Cart", "#8a5a34"); b.add(bx(2.2, 0.15, 1.2).translate(-13.5, 0.8, 2.5), cartM); for (const s of [-1, 1]) b.add(cyl(0.45, 0.45, 0.08, 32).rotateX(Math.PI / 2).translate(-13.5, 0.45, 2.5 + s * 0.66), M("Wheel", "#5a3a24")); for (let k = 0; k < 4; k++) b.add(new THREE.SphereGeometry(0.22, 16, 10).scale(1, 0.8, 1).translate(-14.2 + k * 0.45, 1.05, 2.5), M("Sack", "#c8b080")); }
  for (const [x, z, i] of [[-7, -9.95, 0], [5.5, -9.95, 1], [-6, 9.95, 2], [6.8, 9.95, 3]] as number[][]) { const bn = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 2.4), M("Ban" + i, "#ffffff", bannerTex("b" + i, ["#2f5a9a", "#a8352e", "#3a7a4a", "#6a3a8a"][i], "#f2c94c"), { side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 })); bn.position.set(x, 4.9, z + (z < 0 ? 0.05 : -0.05)); if (z > 0) bn.rotation.y = Math.PI; root.add(bn); sway.push(bn); }
  { const bw = M("BenchW", "#7a5234"); for (const [x, z, ry] of [[-3.5, 4.6, 0], [3.5, -2.0, Math.PI]] as number[][]) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; root.add(g); const bb = new Batch(); bb.add(bx(1.8, 0.08, 0.45).translate(0, 0.45, 0), bw); bb.add(bx(1.8, 0.4, 0.06).translate(0, 0.75, -0.22), bw); for (const s of [-0.8, 0.8]) bb.add(bx(0.08, 0.45, 0.4).translate(s, 0.22, 0), iron); bb.build(g); } }
  // birds on the roofs and pigeons near the fountain (ambient motion)
  const pigeons: THREE.Mesh[] = []; for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 10).scale(1.3, 0.9, 0.9), M("Pigeon", "#8a8e98")); m.userData = { a: i * 1.1, r: 2.9 + (i % 3) * 0.35 }; root.add(m); pigeons.push(m); }
  // quarantine ring (glowing fence of light)
  const qRing = new THREE.Group(); qRing.position.set(PT.QRING[0], 0, PT.QRING[2]); root.add(qRing);
  { const qm = new THREE.MeshBasicMaterial({ color: "#7ae8f0", transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }); const wall = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 1.6, 64, 1, true), qm); wall.position.y = 0.8; wall.layers.set(NOINK); qRing.add(wall);
    for (let k = 0; k < 16; k++) { const a = (k * TAU) / 16, post = new THREE.Mesh(cyl(0.05, 0.05, 1.7, 12), M("QPost", "#f4c430")); post.position.set(Math.cos(a) * 2.6, 0.85, Math.sin(a) * 2.6); qRing.add(post); }
    const qs = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.5), unlit(signTex("quar", "QUARANTINE", "#f4c430", "#1a1a1a"))); qs.position.set(0, 2.0, 2.62); qRing.add(qs); }
  // ======================= GATE + WOODS =======================
  { const gs = M("GateStone", "#ffffff", rep(stoneHD("ptGate", ["#b8ac98", "#ada08a", "#c2b6a2", "#a89a84"], "#7a6e5c"), 3, 3)), [gx] = PT.GATE;
    nc.add(bx(2.2, 8, 1.6).translate(gx, 4, -3.2), gs); nc.add(bx(2.2, 8, 1.6).translate(gx, 4, 3.2), gs); nc.add(bx(2.2, 2.2, 8).translate(gx, 7.0, 0), gs);
    for (const s of [-1, 1]) { nc.add(cyl(2.0, 2.2, 11, 40).translate(gx, 5.5, s * 5.2), gs); b.add(new THREE.ConeGeometry(2.5, 3.4, 40).translate(gx, 12.7, s * 5.2), roofs[1]); for (let k = 0; k < 12; k++) { const a = (k * TAU) / 12; nc.add(bx(0.6, 0.7, 0.6).translate(gx + Math.cos(a) * 2.0, 11.2, s * 5.2 + Math.sin(a) * 2.0), gs); } }
    for (let k = 0; k < 9; k++) b.add(bx(0.08, 1.4, 0.08).translate(gx + 0.6, 5.2, -2.0 + k * 0.5), iron);   // the raised portcullis teeth
    for (const s of [-1, 1]) nc.add(bx(1.2, 4.5, 30).translate(gx, 2.25, s * 21.5), gs);   // the town wall either side
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 3.2), M("GateBan", "#ffffff", bannerTex("gate", "#2f5a9a", "#f2c94c"), { side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 })); fl.position.set(gx + 1.15, 4.6, 0); fl.rotation.y = Math.PI / 2; root.add(fl);
    b.add(quad(V(-46, 0.005, 2.6), V(-28, 0.005, 2.6), V(-28, 0.005, -2.6), V(-46, 0.005, -2.6), 1, 1), M("Path", "#9a8462")); }
  const barkM = lam("ptBark", () => ({ map: barkTex() })), leafM = swayMaterial(lam("ptLeafMS", () => ({ color: "#5e9a46", vertexColors: true }) as THREE.MeshLambertMaterialParameters)), coreM = lam("ptCore", () => ({ color: "#3e7034" }));
  { const r = rng(404); const treeAt: V3[] = []; for (let i = 0; i < 26; i++) treeAt.push([-33 - r() * 26, 0, (r() - 0.5) * 40 + (r() < 0.5 ? 6 : -6)]);
    treeAt.forEach((p, i) => leafyTree(bc, root, p, 6 + r() * 3, 140 + i, leafM, coreM, barkM, 12, leafCardMat("vbLeafCardM"))); }
  // ======================= BOSS CHAMBER =======================
  { const X = 80, wallM = M("Dungeon", "#ffffff", rep(rockWall("dun", "#5a4a4a"), 3, 2)), floorM = M("DunFloor", "#ffffff", rep(stoneHD("ptDunF", ["#5a4e4a", "#524642", "#625652", "#4a3e3a"], "#2a2220"), 4, 4));
    nc.add(quad(V(X - 6, 0.01, 6), V(X + 6, 0.01, 6), V(X + 6, 0.01, -8), V(X - 6, 0.01, -8), 1, 1), floorM);
    nc.add(bx(12, 7.5, 0.4).translate(X, 3.75, -8.2), wallM); nc.add(bx(0.4, 7.5, 14).translate(X - 6.2, 3.75, -1), wallM); nc.add(bx(0.4, 7.5, 14).translate(X + 6.2, 3.75, -1), wallM);
    nc.add(bx(5, 7.5, 0.4).translate(X - 3.5, 3.75, 6.2), wallM); nc.add(bx(5, 7.5, 0.4).translate(X + 3.5, 3.75, 6.2), wallM); nc.add(bx(2, 4.5, 0.4).translate(X, 5.25, 6.2), wallM);
    nc.add(bx(12.4, 0.4, 14.4).translate(X, 7.6, -1), M("DunCeil", "#2a2224"));
    for (const [px, pz] of [[-3.8, -5], [3.8, -5], [-3.8, 0], [3.8, 0], [-3.8, 4], [3.8, 4]]) { nc.add(cyl(0.5, 0.55, 7.5, 32).translate(X + px, 3.75, pz), wallM); nc.add(bx(1.3, 0.4, 1.3).translate(X + px, 0.2, pz), wallM); }
    // the altar steps + the orb on its claw stand
    for (let k = 0; k < 3; k++) nc.add(bx(5 - k * 1.2, 0.3, 3 - k * 0.6).translate(X, 0.15 + k * 0.3, -6.2 + k * 0.2), floorM);
    b.add(cyl(0.12, 0.2, 0.7, 20).translate(X, 1.25, -5.6), M("Claw", "#3a2a2a"));
    // a heavy door (two planked leaves, iron bands), and the rune barrier in front of it
    const dm = M("DunDoor", "#ffffff", rep(planksHD(), 0.4, 0.8)); b.add(bx(1.0, 3.0, 0.15).translate(X - 0.5, 1.5, 6.05), dm); b.add(bx(1.0, 3.0, 0.15).translate(X + 0.5, 1.5, 6.05), dm);
    for (const y of [0.6, 1.5, 2.4]) b.add(bx(2.0, 0.1, 0.18).translate(X, y, 6.0), iron);
    // red torches on the pillars and walls
    for (const [tx, tz] of [[-3.25, -5], [3.25, -5], [-3.25, 0], [3.25, 0], [-5.9, 2.5], [5.9, 2.5]]) { b.add(cyl(0.05, 0.08, 0.6, 12).translate(X + tx, 2.6, tz), iron); const fl = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 16), M("Flame", "#ff6a3a", undefined, { emissive: "#c83010" })); fl.position.set(X + tx, 3.05, tz); fl.userData = { ph: tx * 3 + tz }; root.add(fl); flames.push(fl); }
    for (const [bx0, bz] of [[-5.95, -3], [5.95, -3]]) { const ban = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 3.2), M("DunBan", "#ffffff", bannerTex("dun", "#5a1a1a", "#d8a83a"), { side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 })); ban.position.set(X + bx0, 4.5, bz); ban.rotation.y = bx0 < 0 ? Math.PI / 2 : -Math.PI / 2; root.add(ban); }
    const chains = M("Chain", "#4a4a50"); for (let k = 0; k < 6; k++) b.add(cyl(0.02, 0.02, 2.5, 8).translate(X - 2.5 + k, 6.2, -7.8), chains); }
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 40, 24), new THREE.MeshBasicMaterial({ color: "#ff3a3a" })); orb.position.set(...PT.ORB); orb.layers.set(NOINK); root.add(orb);
  const orbGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: mistTex(), transparent: true, depthWrite: false })); orbGlow.position.set(PT.ORB[0], PT.ORB[1], PT.ORB[2] + 0.1); orbGlow.layers.set(NOINK); root.add(orbGlow);
  const rune = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 3.0), new THREE.MeshBasicMaterial({ map: runeTex(), transparent: true, depthWrite: false })); rune.position.set(PT.DOOR[0], 1.5, 5.9); rune.rotation.y = Math.PI; rune.layers.set(NOINK); root.add(rune);
  // a glowing rune border on the boss-room floor ("it's meant to stay in that room"): c.runeF 0..1
  const runeF: THREE.Mesh[] = []; { const tex = ctex("ptRuneBand", 1024, 64, (g) => { g.clearRect(0, 0, 1024, 64); g.strokeStyle = "rgba(255,80,60,0.95)"; g.lineWidth = 5; g.shadowColor = "#ff3020"; g.shadowBlur = 12; g.strokeRect(4, 6, 1016, 52); for (let i = 0; i < 16; i++) { const x = 32 + i * 64; g.beginPath(); g.arc(x, 32, 14, 0, TAU); g.moveTo(x - 14, 32); g.lineTo(x + 14, 32); g.stroke(); } });
    for (const [x0, z0, x1, z1] of [[74.4, -7.6, 85.6, -7.6], [85.6, -7.6, 85.6, 5.6], [85.6, 5.6, 74.4, 5.6], [74.4, 5.6, 74.4, -7.6]]) { const L = Math.hypot(x1 - x0, z1 - z0); const m = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.45), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.rotation.z = -Math.atan2(z1 - z0, x1 - x0); m.position.set((x0 + x1) / 2, 0.03, (z0 + z1) / 2); m.layers.set(NOINK); root.add(m); runeF.push(m); } }
  const mist: THREE.Mesh[] = []; for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.6), new THREE.MeshBasicMaterial({ map: mistTex(), transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.layers.set(NOINK); m.userData = { i }; root.add(m); mist.push(m); }
  // ======================= THE OFFICE =======================
  { const X = 160, wall = M("OffWall", "#dccfb8"), carpet = M("Carpet", "#6e5e50");
    nc.add(quad(V(X - 4, 0.01, 4), V(X + 4, 0.01, 4), V(X + 4, 0.01, -5), V(X - 4, 0.01, -5), 1, 1), carpet);
    nc.add(bx(8, 3.2, 0.2).translate(X, 1.6, -5.1), wall); nc.add(bx(0.2, 3.2, 9).translate(X - 4.1, 1.6, -0.5), wall); nc.add(bx(0.2, 3.2, 9).translate(X + 4.1, 1.6, -0.5), wall); nc.add(bx(8.4, 0.2, 9.4).translate(X, 3.3, -0.5), M("OffCeil", "#d8dad8"));
    for (let k = 0; k < 3; k++) b.add(bx(1.4, 0.05, 0.3).translate(X - 2.5 + k * 2.5, 3.17, -1.5), M("Fluor", "#f2f0e0", undefined, { emissive: "#7a7860" }));
    const desk = M("Desk", "#b89a74"); for (const [dx, dz] of [[-1.4, -2.6], [1.8, -2.6], [-1.4, 1.2]]) { b.add(bx(2.4, 0.06, 1.0).translate(X + dx, 0.76, dz), desk); for (const s of [-1.1, 1.1]) b.add(bx(0.06, 0.74, 0.9).translate(X + dx + s, 0.37, dz), M("DeskLeg", "#6a6a70"));
      b.add(cyl(0.28, 0.28, 0.08, 24).translate(X + dx, 0.48, dz + 0.9), M("ChairS", "#2a2e38")); b.add(bx(0.5, 0.6, 0.08).translate(X + dx, 0.85, dz + 1.16), M("ChairS", "#2a2e38")); b.add(cyl(0.03, 0.03, 0.44, 10).translate(X + dx, 0.22, dz + 0.9), M("DeskLeg", "#6a6a70")); }
    for (const [dx, dz, k] of [[1.0, -2.95, 0], [2.6, -2.95, 1], [-0.6, 0.85, 2]] as number[][]) { b.add(bx(0.9, 0.56, 0.05).translate(X + dx, 1.12, dz), M("Bezel", "#1a1c22")); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.48), unlit(screenTex("s" + k, ["#7ad0f0", "#8af08a", "#f0d07a"][k]), 1)); s.position.set(X + dx, 1.12, dz + 0.03); s.layers.set(NOINK); root.add(s); b.add(bx(0.08, 0.3, 0.08).translate(X + dx, 0.92, dz), M("Bezel", "#1a1c22")); }
    b.add(bx(0.5, 0.03, 0.18).translate(X - 1.2, 0.8, -2.3), M("Kbd", "#2a2e38")); b.add(cyl(0.05, 0.04, 0.1, 16).translate(X - 2.2, 0.84, -2.4), M("Mug", "#c8352e"));
    // posters, a plant, a water cooler, a whiteboard of sticky notes
    for (let k = 0; k < 12; k++) b.add(bx(0.16, 0.16, 0.01).translate(X - 3.0 + (k % 4) * 0.2, 1.6 + Math.floor(k / 4) * 0.2, -4.98), M("Note" + (k % 3), ["#f4e04a", "#f49ac0", "#8ad0f0"][k % 3]));
    b.add(cyl(0.22, 0.18, 0.4, 24).translate(X + 3.5, 0.2, 3.3), M("Pot", "#a8643a")); b.add(new THREE.IcosahedronGeometry(0.5, 1).translate(X + 3.5, 0.9, 3.3), M("Plant", "#4a8a4a"));
    b.add(cyl(0.18, 0.18, 1.0, 24).translate(X - 3.6, 0.5, 3.3), M("Cooler", "#e2e6ea")); b.add(cyl(0.16, 0.16, 0.4, 24).translate(X - 3.6, 1.2, 3.3), M("CoolerW", "#7ab8e0", undefined, { transparent: true, opacity: 0.7 }));
    // the server rack
    const [rx, , rz] = PT.RACK; b.add(bx(1.0, 2.2, 0.8).translate(rx, 1.1, rz), M("Rack", "#1e2228")); for (let k = 0; k < 8; k++) b.add(bx(0.9, 0.16, 0.02).translate(rx, 0.35 + k * 0.23, rz + 0.41), M("Blade", "#30363e"));
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.24), unlit(signTex("rs", "RESTART", "#c8352e", "#f4f0e2"))); sg.position.set(rx, 2.0, rz + 0.42); root.add(sg); }
  const leds: THREE.Mesh[] = []; for (let k = 0; k < 16; k++) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.025, 12), new THREE.MeshBasicMaterial({ color: k % 3 ? "#4af06a" : "#f0a43a" })); m.position.set(PT.RACK[0] - 0.35 + (k % 4) * 0.08, 0.38 + Math.floor(k / 4) * 0.46, PT.RACK[2] + 0.43); m.layers.set(NOINK); root.add(m); leds.push(m); }
  const lever = new THREE.Group(); lever.position.set(PT.RACK[0] + 0.62, 1.3, PT.RACK[2] + 0.2); root.add(lever);
  { const lb = new Batch(); lb.add(bx(0.1, 0.3, 0.2).translate(-0.05, 0, 0), M("LevBase", "#3a3e46")); lb.add(cyl(0.035, 0.035, 0.7, 16).translate(0, 0.35, 0), M("LevRod", "#c8ccd0")); lb.add(new THREE.SphereGeometry(0.1, 24, 16).translate(0, 0.72, 0), M("LevKnob", "#d8352e")); lb.build(lever); }
  const monMat = unlit(mapTex(0, true), 1); { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.12), monMat); m.position.set(PT.OFFICE[0] - 1.4, 1.42, -4.97); m.layers.set(NOINK); root.add(m); b.add(bx(1.62, 1.24, 0.05).translate(PT.OFFICE[0] - 1.4, 1.42, -5.0), M("Bezel", "#1a1c22")); }
  const dial = new THREE.Group(); dial.position.set(...PT.DIAL); root.add(dial);
  { const face = new THREE.Mesh(new THREE.CircleGeometry(0.6, 64), unlit(dialTex(), 0.95)); dial.add(face); const hand = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.48), new THREE.MeshBasicMaterial({ color: "#2a1a10" })); hand.position.set(0, 0.2, 0.01); hand.name = "hand"; const hg = new THREE.Group(); hg.name = "handG"; hg.add(hand); dial.add(hg); b.add(new THREE.TorusGeometry(0.62, 0.04, 12, 64).translate(...PT.DIAL), M("DialRim", "#8a6a3a")); }
  // ======================= THE STUDY =======================
  { const X = 240, wall = M("StudyWall", "#ffffff", rep(planksHD(), 1, 1)), fl = M("StudyFloor", "#ffffff", rep(planksHD(), 2, 2));
    nc.add(quad(V(X - 4, 0.01, 3), V(X + 4, 0.01, 3), V(X + 4, 0.01, -4), V(X - 4, 0.01, -4), 1, 1), fl);
    nc.add(bx(8, 3.2, 0.2).translate(X, 1.6, -4.1), M("StudyBack", "#7a8a6a")); nc.add(bx(0.2, 3.2, 7).translate(X - 4.1, 1.6, -0.5), M("StudyBack", "#7a8a6a")); nc.add(bx(0.2, 3.2, 7).translate(X + 4.1, 1.6, -0.5), M("StudyBack", "#7a8a6a")); nc.add(bx(8.4, 0.2, 7.4).translate(X, 3.3, -0.5), M("OffCeil", "#d8dad8")); void wall;
    b.add(bx(2.6, 1.6, 0.06).translate(X, 1.6, -3.96), M("ChalkFrame", "#6a4a32"));
    const shelfM = M("Shelf", "#6a4a32"); for (const sx of [-3.0, 3.0]) { b.add(bx(1.4, 2.4, 0.4).translate(X + sx, 1.2, -3.8), shelfM); const r = rng(sx > 0 ? 3 : 4); for (let row = 0; row < 4; row++) for (let k = 0; k < 9; k++) b.add(bx(0.11, 0.38 + r() * 0.1, 0.28).translate(X + sx - 0.6 + k * 0.145, 0.38 + row * 0.56, -3.75), M("Book" + ((k + row) % 5), ["#c8352e", "#2f5d9a", "#3a7a4a", "#d8a83a", "#6a3a8a"][(k + row) % 5])); }
    b.add(bx(2.2, 0.06, 1.0).translate(X, 0.78, -1.6), M("Desk", "#b89a74")); for (const s of [-1, 1]) for (const t of [-0.4, 0.4]) b.add(bx(0.06, 0.76, 0.06).translate(X + s * 1.0, 0.38, -1.6 + t), M("DeskLeg", "#5a3a24"));
    for (let k = 0; k < 4; k++) b.add(bx(0.32, 0.05, 0.42).translate(X - 0.7 + k * 0.08, 0.84 + k * 0.05, -1.6), M("Jour" + (k % 2), k % 2 ? "#2f5d9a" : "#e8e0cc"));
    b.add(cyl(0.12, 0.14, 0.3, 24).translate(X + 3.4, 0.15, -2.6), M("Lamp", "#3a6a5a")); b.add(cyl(0.03, 0.03, 1.3, 12).translate(X + 3.4, 0.9, -2.6), M("Lamp", "#3a6a5a")); b.add(new THREE.ConeGeometry(0.26, 0.25, 32).translate(X + 3.4, 1.6, -2.6), M("LampSh", "#e8d8a8", undefined, { emissive: "#4a3a1a" }));
    const wm = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.98), unlit(mapTex(1, false), 0.92)); wm.position.set(X + 3.98, 1.7, -1.0); wm.rotation.y = -Math.PI / 2; root.add(wm);
    b.add(bx(0.06, 1.4, 1.2).translate(X - 4.0, 1.8, -0.4), M("WinS", "#a8c8e0", undefined, { emissive: "#24384a" })); }
  const chalkMat = unlit(curveTex(0), 0.92); { const m = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 1.45), chalkMat); m.position.set(PT.CHALK[0], PT.CHALK[1], PT.CHALK[2]); m.layers.set(NOINK); root.add(m); }

  // ---------------- lights (no-shadow warm lamps for the interiors; the boss room red) ----------------
  for (const [x, y, z, i, d, col] of [[80, 3.2, -5, 2.2, 9, "#ff5a3a"], [80, 3.0, 2, 1.6, 9, "#ff7a4a"], [158, 2.9, -1.5, 1.4, 8, "#f2f0e0"], [162, 2.9, 1.5, 1.0, 7, "#f2f0e0"], [240, 2.8, -1.0, 1.4, 7, "#ffd8a0"]] as [number, number, number, number, number, string][]) {
    const pl = new THREE.PointLight(col, i, d, 2); pl.position.set(x, y, z); root.add(pl); }
  b.build(root); bc.build(root);
  { const ncG = new THREE.Group(); root.add(ncG); nc.build(ncG, false); ncG.traverse((o) => { o.userData.noCast = true; }); }

  const marks: Record<string, V3> = { bram: PT.BRAM, boss: PT.BOSS };
  const cams: SetDef["cams"] = {
    square: { pos: [0, 2.2, 9.0], look: [0, 1.4, -4], fov: 56 },
    stall: { pos: [-6.2, 1.55, -3.6], look: [-6.5, 1.2, -7.6], fov: 50 },
    gate: { pos: [-18, 1.8, 1.0], look: [-28, 2.2, 0], fov: 54 },
    boss: { pos: [80, 1.8, 2.5], look: [80, 1.5, -5.5], fov: 54 },
    office: { pos: [160, 1.6, 2.8], look: [160, 1.2, -3.5], fov: 56 },
    study: { pos: [240, 1.6, 2.2], look: [240, 1.3, -3.5], fov: 54 },
  };
  let lastMap = -1, lastCurve = -1;
  return {
    name: "plaguetown", root, marks, cams, title: [orb],
    pose: (t, c) => {
      const pulse = 0.5 + 0.5 * Math.sin(t * 5);
      orb.scale.setScalar(1 + 0.06 * pulse); orbGlow.scale.setScalar(1 + 0.15 * pulse); (orbGlow.material as THREE.MeshBasicMaterial).opacity = 0.7 + 0.3 * pulse;
      (rune.material as THREE.MeshBasicMaterial).opacity = (c.rune ?? 1) * (0.7 + 0.3 * Math.sin(t * 3));
      runeF.forEach((m) => { const k = c.runeF ?? 0; m.visible = k > 0.01; (m.material as THREE.MeshBasicMaterial).opacity = k * (0.75 + 0.25 * Math.sin(t * 7)); });
      const mk = c.mist ?? 0; mist.forEach((m) => { const i = m.userData.i as number, u = cl(mk * 1.2 - i * 0.04); m.visible = u > 0.01; m.position.set(PT.DOOR[0] - 0.8 + (i % 5) * 0.4 + 0.1 * Math.sin(t * 2 + i), 0.03 + i * 0.003, -3.5 + u * 9.6 + (i % 2) * 0.3); if (m.position.z > 6.0) m.visible = false; m.scale.setScalar(0.6 + u); (m.material as THREE.MeshBasicMaterial).opacity = Math.min(1, u * 2) * 0.9; });
      { const k = Math.round(cl(c.mapRed ?? 0) * 10), q = Math.round(cl(c.qMap ?? 0) * 4), ph = q > 2 ? Math.floor(t * 6) % 12 : 0, key = k * 1000 + q * 100 + ph; if (key !== lastMap) { boardMat.map = mapTex(k / 10, false); monMat.map = mapTex(k / 10, true, q / 4, ph); boardMat.needsUpdate = monMat.needsUpdate = true; lastMap = key; } }
      { const k = Math.round(cl(c.curve ?? 0) * 12); if (k !== lastCurve) { chalkMat.map = curveTex(k / 12); chalkMat.needsUpdate = true; lastCurve = k; } }
      const q = c.qRing ?? 0; qRing.visible = q > 0.01; qRing.scale.set(1, Math.max(0.01, sm(q)), 1); ((qRing.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.15 * Math.sin(t * 6);
      lever.rotation.x = -1.1 * sm(c.lever ?? 0);
      const bl = c.blink ?? 0; leds.forEach((m, k) => { (m.material as THREE.MeshBasicMaterial).color.setStyle(bl > 0.5 ? (Math.floor(t * 8 + k) % 2 ? "#202020" : "#f0a43a") : (Math.floor(t * 3 + k * 1.7) % 4 ? (k % 3 ? "#4af06a" : "#f0a43a") : "#1a3a1a")); });
      (dial.getObjectByName("handG") as THREE.Object3D).rotation.z = TAU * (c.rewind ?? 0) + 0.3;
      flames.forEach((m) => { const ph = m.userData.ph as number; m.scale.set(1 + 0.12 * Math.sin(t * 17 + ph), 1 + 0.25 * Math.sin(t * 11 + ph * 2), 1 + 0.12 * Math.cos(t * 13 + ph)); });
      sway.forEach((m, i) => { m.rotation.z = 0.05 * Math.sin(t * 1.3 + i * 1.7); m.rotation.x = 0.04 * Math.sin(t * 0.9 + i); });
      pigeons.forEach((m, i) => { const d = m.userData as { a: number; r: number }, a = d.a + t * 0.12 * (i % 2 ? 1 : -1); m.position.set(PT.FOUNT[0] + Math.cos(a) * d.r, 0.13 + Math.abs(Math.sin(t * 9 + i)) * 0.03, PT.FOUNT[2] + Math.sin(a) * d.r); m.rotation.y = -a; });
    },
  };
};
