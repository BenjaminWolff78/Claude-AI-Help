// Calcutta pieces: Indo-Saracenic palaces (painted arcades with lit arches, onion domes on drums, chhatris,
// minarets, parapets), ghat steps, straw parasols, marigold garlands, the TUDOR ICE CO. route board.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { ctex, rng, stoneHD, beamHD } from "../paint";
import { twoTone } from "../shade";
import { M, TAU, fitText } from "./portkit_common";
import type { V3 } from "./types";

const blot = (g: CanvasRenderingContext2D, x: number, y: number, rad: number, rgba: string) => {
  const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
};
const archPath = (g: CanvasRenderingContext2D, cx: number, by: number, w: number, h: number) => { // pointed (ogee-ish) arch
  const sh = h - w * 0.75; g.beginPath(); g.moveTo(cx - w / 2, by); g.lineTo(cx - w / 2, by - sh);
  g.quadraticCurveTo(cx - w / 2, by - sh - w * 0.55, cx, by - h); g.quadraticCurveTo(cx + w / 2, by - sh - w * 0.55, cx + w / 2, by - sh); g.lineTo(cx + w / 2, by); g.closePath();
};
/** arcade facade (albedo + matching emissive map with the lit arches), 64 px / m */
const arcade = (key: string, wm: number, hm: number, wall: string, trim: string, lit: number) => {
  const PX = Math.min(64, 2048 / Math.max(wm, hm)), W = Math.round(wm * PX), H = Math.round(hm * PX), m = (v: number) => v * PX;
  const floors = Math.max(1, Math.floor(hm / 3.2)), bays = Math.max(1, Math.floor(wm / 2.3));
  const litSet = new Set<number>(); { const r = rng(key.length * 17 + floors); for (let i = 0; i < floors * bays; i++) if (r() < lit) litSet.add(i); }
  const draw = (emis: boolean) => (g: CanvasRenderingContext2D, r: () => number) => {
    g.fillStyle = emis ? "#000000" : wall; g.fillRect(0, 0, W, H);
    if (!emis) {
      for (let i = 0; i < (wm * hm) / 4 + 6; i++) blot(g, r() * W, r() * H, m(0.5 + r() * 1.4), r() > 0.5 ? "rgba(255,250,235,0.12)" : "rgba(130,80,50,0.10)");
      for (let fl = 0; fl < floors; fl++) { const y = H - m(fl * 3.2); g.fillStyle = trim; g.fillRect(0, y - m(0.22), W, m(0.22)); g.fillStyle = "rgba(90,50,30,0.35)"; g.fillRect(0, y - m(0.04), W, m(0.04)); }
      g.fillStyle = trim; g.fillRect(0, 0, W, m(0.5)); // frieze
      for (let x = 0; x < W; x += m(0.4)) { g.fillStyle = "rgba(170,70,50,0.6)"; g.beginPath(); g.moveTo(x + m(0.2), m(0.08)); g.lineTo(x + m(0.36), m(0.25)); g.lineTo(x + m(0.2), m(0.42)); g.lineTo(x + m(0.04), m(0.25)); g.closePath(); g.fill(); }
      for (let i = 0; i <= bays; i++) { g.fillStyle = "rgba(255,248,230,0.35)"; g.fillRect((i * W) / bays - m(0.12), m(0.5), m(0.24), H); g.fillStyle = "rgba(90,50,30,0.25)"; g.fillRect((i * W) / bays + m(0.1), m(0.5), m(0.03), H); }
    }
    for (let fl = 0; fl < floors; fl++) for (let i = 0; i < bays; i++) {
      const cx = ((i + 0.5) * W) / bays, by = H - m(fl * 3.2 + (fl === 0 ? 0.0 : 0.7)), aw = m(fl === 0 ? 1.5 : 1.1), ah = m(fl === 0 ? 2.7 : 1.9);
      const isLit = litSet.has(fl * bays + i);
      if (!emis) { archPath(g, cx, by, aw + m(0.3), ah + m(0.22)); g.fillStyle = trim; g.fill(); g.strokeStyle = "rgba(80,40,30,0.6)"; g.lineWidth = 2; g.stroke(); }
      archPath(g, cx, by, aw, ah);
      if (emis) { g.fillStyle = isLit ? "#ffb85a" : "#000000"; g.fill(); continue; }
      const gr = g.createLinearGradient(0, by - ah, 0, by); if (isLit) { gr.addColorStop(0, "#ffe2a0"); gr.addColorStop(1, "#ffb04a"); } else { gr.addColorStop(0, "#5a2f3a"); gr.addColorStop(1, "#8a4a3a"); }
      g.fillStyle = gr; g.fill(); g.strokeStyle = "rgba(60,30,25,0.7)"; g.lineWidth = 2.5; g.stroke();
      if (fl > 0) { g.fillStyle = trim; g.fillRect(cx - aw / 2 - m(0.15), by - m(0.05), aw + m(0.3), m(0.12)); for (let k = 0; k < 6; k++) g.fillRect(cx - aw / 2 + (k * aw) / 5 - m(0.02), by - m(0.55), m(0.04), m(0.5)); g.fillRect(cx - aw / 2 - m(0.1), by - m(0.6), aw + m(0.2), m(0.07)); }
      if (isLit && fl > 0) { g.fillStyle = "rgba(120,50,30,0.45)"; g.fillRect(cx - m(0.02), by - ah + m(0.4), m(0.04), ah - m(0.4)); }
    }
    if (!emis) for (let i = 0; i < 4; i++) { let x = r() * W, y = r() * H * 0.7; g.strokeStyle = "rgba(110,70,50,0.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += m((r() - 0.5) * 0.2); y += m(0.1 + r() * 0.1); g.lineTo(x, y); } g.stroke(); }
  };
  return { map: ctex(`arc|${key}`, W, H, draw(false)), em: ctex(`arcE|${key}`, W, H, draw(true)) };
};
const domeTex = (col: string, band: string) => ctex(`dome|${col}|${band}`, 512, 512, (g, r) => {
  g.fillStyle = col; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 16; i++) { g.fillStyle = "rgba(120,70,50,0.22)"; g.fillRect(i * 32, 0, 3, 512); g.fillStyle = "rgba(255,255,240,0.25)"; g.fillRect(i * 32 + 4, 0, 6, 512); }
  g.fillStyle = band; g.fillRect(0, 440, 512, 30); g.fillStyle = "rgba(255,240,200,0.6)"; for (let x = 8; x < 512; x += 32) { g.beginPath(); g.arc(x, 455, 6, 0, TAU); g.fill(); }
  for (let i = 0; i < 12; i++) blot(g, r() * 512, r() * 512, 50, "rgba(140,90,60,0.12)");
});
const onionPts = [[0, 0], [0.92, 0], [1.0, 0.22], [1.1, 0.6], [0.98, 1.05], [0.66, 1.45], [0.3, 1.8], [0.1, 2.05], [0.0, 2.15]];
export const onionDome = (parent: THREE.Object3D, pos: V3, r: number, col = "#f6ecd6", band = "#d98a3a") => {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const geo = new THREE.LatheGeometry(onionPts.map(([x, y]) => new THREE.Vector2(x * r, y * r)), 28);
  const d = new THREE.Mesh(geo, lam(`domeM${col}${band}`, () => ({ map: domeTex(col, band) }))); d.castShadow = true; d.receiveShadow = true; g.add(d);
  const gm = M.gold();
  const f1 = new THREE.Mesh(new THREE.SphereGeometry(0.12 * r, 10, 8), gm); f1.position.y = 2.15 * r + 0.05 * r; g.add(f1);
  const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.05 * r, 0.7 * r, 8), gm); f2.position.y = 2.6 * r; g.add(f2);
  const f3 = new THREE.Mesh(new THREE.SphereGeometry(0.07 * r, 10, 8), gm); f3.position.y = 2.42 * r; g.add(f3);
  return g;
};
/** small open pavilion: base slab, 4 columns, overhanging eave, little dome */
export const chhatri = (parent: THREE.Object3D, pos: V3, s: number, col: string, trim: string) => {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); parent.add(g);
  const tm = lam("chTrim" + trim, () => ({ color: trim })), wm = lam("chWall" + col, () => ({ color: col }));
  const slab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.16, 1.5).translate(0, 0.08, 0), tm); g.add(slab);
  for (const x of [-0.6, 0.6]) for (const z of [-0.6, 0.6]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.2, 8).translate(x, 0.76, z), wm); c.castShadow = true; g.add(c); }
  const eave = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.25, 0.18, 4, 1).rotateY(Math.PI / 4).translate(0, 1.45, 0), tm); eave.castShadow = true; g.add(eave);
  onionDome(g, [0, 1.54, 0], 0.55, col, "#d98a3a");
  return g;
};
export type PalaceOpts = { wall: string; trim: string; dome?: number; chhatris?: boolean; minarets?: boolean; lit?: number; domeCol?: string };
/** Indo-Saracenic palace, front facade on local +z, flat roof with parapet, centre dome on a drum */
export const palace = (b: Batch, parent: THREE.Object3D, x: number, z: number, yaw: number, w: number, d: number, h: number, o: PalaceOpts, y = 0) => {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; parent.add(g);
  const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);
  const fa = arcade(`f${o.wall}${w}x${h}`, w, h, o.wall, o.trim, o.lit ?? 0.35), sa = arcade(`s${o.wall}${d}x${h}`, d, h, o.wall, o.trim, (o.lit ?? 0.35) * 0.6);
  const fm = lam(`palF${o.wall}${w}x${h}`, () => ({ map: fa.map, emissive: "#ffffff", emissiveMap: fa.em, emissiveIntensity: 0.9 }));
  const sm2 = lam(`palS${o.wall}${d}x${h}`, () => ({ map: sa.map, emissive: "#ffffff", emissiveMap: sa.em, emissiveIntensity: 0.9 }));
  const hw = w / 2, hd = d / 2;
  b.add(quad(V(-hw, 0, hd), V(hw, 0, hd), V(hw, h, hd), V(-hw, h, hd)), fm, m);
  b.add(quad(V(hw, 0, -hd), V(-hw, 0, -hd), V(-hw, h, -hd), V(hw, h, -hd)), fm, m);
  b.add(quad(V(-hw, 0, -hd), V(-hw, 0, hd), V(-hw, h, hd), V(-hw, h, -hd)), sm2, m);
  b.add(quad(V(hw, 0, hd), V(hw, 0, -hd), V(hw, h, -hd), V(hw, h, hd)), sm2, m);
  const tm = lam("palTrim" + o.trim, () => ({ color: o.trim })), roof = lam("palRoof" + o.wall, () => ({ color: o.wall }));
  b.add(quad(V(-hw, h, hd), V(hw, h, hd), V(hw, h, -hd), V(-hw, h, -hd)), roof, m);
  b.add(boxGeo(V(-hw - 0.45, h - 0.15, -hd - 0.45), V(hw + 0.45, h, hd + 0.45), 0, true), tm, m);     // chhajja eave
  b.add(boxGeo(V(-hw - 0.1, h, -hd - 0.1), V(hw + 0.1, h + 0.35, hd + 0.1)), roof, m);               // parapet wall
  for (let px = -hw; px <= hw + 1e-3; px += 0.7) for (const pz of [-hd, hd]) b.add(boxGeo(V(px - 0.16, h + 0.35, pz - 0.12), V(px + 0.16, h + 0.75, pz + 0.12)), tm, m);
  for (let pz = -hd + 0.7; pz < hd; pz += 0.7) for (const px of [-hw, hw]) b.add(boxGeo(V(px - 0.12, h + 0.35, pz - 0.16), V(px + 0.12, h + 0.75, pz + 0.16)), tm, m);
  b.add(boxGeo(V(-hw - 0.1, -0.05, -hd - 0.1), V(hw + 0.1, 0.6, hd + 0.1), 1.5), lam("palPlinth", () => ({ map: stoneHD("calPlinthHD", ["#d9b48a", "#cfa97c", "#e2c09a", "#c79f72"], "#a07a54") })), m);
  if (o.dome) {
    const r = o.dome; const drum = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.95, r * 1.0, r * 0.7, 24, 1), lam("drum" + o.wall, () => ({ map: arcade(`drum${o.wall}`, 8, 2.4, o.wall, o.trim, 0.6).map, emissive: "#ffffff", emissiveMap: arcade(`drum${o.wall}`, 8, 2.4, o.wall, o.trim, 0.6).em, emissiveIntensity: 0.9 })));
    drum.position.set(0, h + r * 0.35, 0); drum.castShadow = true; g.add(drum);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.08, r * 1.08, 0.18, 24), tm); ring.position.set(0, h + r * 0.7, 0); g.add(ring);
    onionDome(g, [0, h + r * 0.75, 0], r, o.domeCol ?? "#f6ecd6");
  }
  if (o.chhatris) for (const sx of [-1, 1]) for (const sz of [-1, 1]) chhatri(g, [sx * (hw - 0.9), h + 0.35, sz * (hd - 0.9)], 0.9, o.wall, o.trim);
  if (o.minarets) for (const sx of [-1, 1]) {
    const mx = sx * (hw + 0.5), mz = hd + 0.5, mh = h + 4;
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, mh, 14).translate(mx, mh / 2, mz), lam("minaret" + o.wall, () => ({ map: arcade(`min${o.wall}`, 3, 12, o.wall, o.trim, 0.2).map }))); sh.castShadow = true; g.add(sh);
    for (const yy of [h * 0.55, h + 0.4, mh - 0.4]) { const bal = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.6, 0.22, 14), tm); bal.position.set(mx, yy, mz); g.add(bal); }
    onionDome(g, [mx, mh, mz], 0.5, o.domeCol ?? "#f6ecd6");
  }
  return g;
};
/** ghat: stone steps from y = 0 at z0 down into the river (towards -z), between x0..x1 */
export const ghat = (b: Batch, x0: number, x1: number, z0: number, n: number, rise: number, run: number) => {
  const st = lam("ghatStone", () => ({ map: stoneHD("ghatHD", ["#e2b98c", "#d8ad80", "#e9c69e", "#cfa476"], "#a8825e") }));
  for (let k = 0; k < n; k++) b.add(boxGeo(V(x0, -3.5, z0 - run * (k + 1)), V(x1, -rise * (k + 1), z0 - run * k), 1.6), st);
  for (const x of [x0, x1]) b.add(boxGeo(V(x - 0.4, -3.5, z0 - run * n), V(x + 0.4, 0.5, z0), 1.6), st); // side walls
};
/** straw parasol on a bamboo pole (the ghat umbrellas) */
export const parasol = (parent: THREE.Object3D, pos: V3, s = 1, tilt = 0.1) => {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.z = tilt; g.scale.setScalar(s); parent.add(g);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.6, 6).translate(0, 1.3, 0), lam("bamboo", () => ({ color: "#c9a25a" }))); pole.castShadow = true; g.add(pole);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.6, 18, 1, true).translate(0, 2.7, 0), lam("straw", () => ({ map: strawTex(), side: THREE.DoubleSide }))); cone.castShadow = true; g.add(cone);
  return g;
};
const strawTex = () => ctex("straw", 256, 256, (g, r) => {
  g.fillStyle = "#d9b265"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 400; i++) { g.strokeStyle = r() < 0.5 ? "rgba(150,110,50,0.5)" : "rgba(255,240,190,0.5)"; g.lineWidth = 1.5; const x = r() * 256; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - 0.5) * 10, 256); g.stroke(); }
  for (let i = 0; i < 5; i++) { g.fillStyle = "rgba(120,80,40,0.5)"; g.fillRect(0, i * 52 + 20, 256, 4); }
});
/** marigold garland: one fat tube along a sagging curve with a painted flower texture (reads as a garland,
 *  not a chain: a single ink silhouette), emissive lift so it stays orange in the violet shade */
const marigoldTex = () => ctex("marigold", 256, 64, (g, r) => {
  g.fillStyle = "#e8661a"; g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 70; i++) { const x = r() * 256, y = r() * 64, rr = 6 + r() * 7; g.fillStyle = r() < 0.35 ? "#ffd23a" : "#ff8a1e"; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); g.fillStyle = "rgba(160,60,10,0.5)"; g.beginPath(); g.arc(x, y, rr * 0.35, 0, TAU); g.fill(); }
});
export const garland = (b: Batch, a: V3, c: V3, sag: number) => {
  const A = V(...a), C = V(...c), pts = Array.from({ length: 9 }, (_, i) => { const u = i / 8; return A.clone().lerp(C, u).add(V(0, -sag * 4 * u * (1 - u), 0)); });
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.075, 7, false);
  const uv = geo.attributes.uv as THREE.BufferAttribute; const L = A.distanceTo(C); for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * L * 2);
  b.add(geo, lam("marigoldTube", () => ({ map: marigoldTex(), emissive: "#ff7a1a", emissiveIntensity: 0.35 })));
};
// ---------------- the TUDOR ICE CO. board ----------------
export const PORTS = ["HAVANA", "CALCUTTA", "BOMBAY", "RIO", "HONG KONG", "NEW ORLEANS"];
export const BOARD = { w: 4.6, h: 3.0, rows0: 0.39, rowH: 0.105, lineX0: 0.43, lineX1: 0.93 }; // row centres from the top, fractions of h
const boardTex = () => ctex("tudorBoard", 2048, 1336, (g, r) => {
  const W = 2048, H = 1336;
  g.fillStyle = "#f4e3bc"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 30; i++) blot(g, r() * W, r() * H, 80 + r() * 180, "rgba(170,120,60,0.10)");
  g.fillStyle = "#8a2a24"; g.fillRect(0, 0, W, 300); g.fillStyle = "rgba(255,230,190,0.18)"; g.fillRect(0, 0, W, 10);
  g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#ffe7a8"; fitText(g, "TUDOR ICE CO.", W / 2, 158, W * 0.86, 210);
  g.fillStyle = "#d6a640"; g.fillRect(60, 312, W - 120, 10);
  const y0 = BOARD.rows0 * H, rh = BOARD.rowH * H;
  g.textAlign = "left"; g.fillStyle = "#3a2216"; g.font = "700 46px Georgia, serif"; fitText(g, "FROM BOSTON TO:", 90, 370, 900, 46, "700 %spx Georgia, serif");
  PORTS.forEach((p, i) => {
    const y = y0 + i * rh; g.fillStyle = i % 2 ? "rgba(140,90,40,0.08)" : "rgba(255,255,255,0.12)"; g.fillRect(60, y - rh / 2, W - 120, rh);
    g.fillStyle = "#2a1a14"; g.textAlign = "left"; fitText(g, p, 100, y + 4, W * (BOARD.lineX0 - 0.07), 108, "900 %spx Georgia, serif");
    g.strokeStyle = "#2f63b0"; g.lineWidth = 7; g.setLineDash([22, 18]); g.beginPath(); g.moveTo(W * BOARD.lineX0, y); g.lineTo(W * BOARD.lineX1, y); g.stroke(); g.setLineDash([]);
    g.fillStyle = "#c8352e"; g.beginPath(); g.arc(W * BOARD.lineX1, y, 18, 0, TAU); g.fill(); g.fillStyle = "#2f63b0"; g.beginPath(); g.arc(W * BOARD.lineX0, y, 12, 0, TAU); g.fill();
  });
  g.strokeStyle = "#5a3418"; g.lineWidth = 16; g.strokeRect(8, 8, W - 16, H - 16);
});
const shipIcon = () => ctex("shipIcon", 256, 192, (g) => {
  g.fillStyle = "#5a3426"; g.beginPath(); g.moveTo(20, 120); g.lineTo(236, 120); g.lineTo(206, 168); g.lineTo(46, 168); g.closePath(); g.fill(); g.strokeStyle = "#1e1418"; g.lineWidth = 7; g.stroke();
  g.fillStyle = "#d4a72c"; g.fillRect(40, 126, 180, 9);
  g.fillStyle = "#1e1418"; g.fillRect(122, 18, 8, 104); g.fillRect(70, 34, 7, 88);
  g.fillStyle = "#fbf3df"; for (const [x, w] of [[126, 70], [73, 50]]) { g.beginPath(); g.moveTo(x - w / 2, 30); g.quadraticCurveTo(x, 50, x + w / 2, 30); g.lineTo(x + w / 2, 106); g.quadraticCurveTo(x, 118, x - w / 2, 106); g.closePath(); g.fill(); g.strokeStyle = "#1e1418"; g.lineWidth = 5; g.stroke(); }
  g.fillStyle = "#c8352e"; g.beginPath(); g.moveTo(130, 16); g.lineTo(168, 26); g.lineTo(130, 36); g.fill();
});
/** board on posts (face unlit so it always reads), returns the moving ship markers */
export const tudorBoard = (parent: THREE.Object3D, pos: V3, yaw: number) => {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = yaw; parent.add(g);
  const { w, h } = BOARD, y0 = 2.75;
  const wood = lam("boardWood", () => ({ map: beamHD() }));
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, h + 0.3, 0.14), wood); frame.position.y = y0 + h / 2; frame.castShadow = true; g.add(frame);
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.2, y0 + h + 0.6, 0.2).translate(sx * (w / 2 + 0.05), (y0 + h + 0.6) / 2, -0.12), wood); p.castShadow = true; g.add(p); const k = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), M.gold()); k.position.set(sx * (w / 2 + 0.05), y0 + h + 0.72, -0.12); g.add(k); }
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: boardTex(), color: "#f6ead2" })); face.position.set(0, y0 + h / 2, 0.075); g.add(face);
  // crown crest on top
  const crown = new THREE.Group(); crown.position.set(0, y0 + h + 0.2, 0); g.add(crown);
  const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.3, 16, 1, true), twoTone(new THREE.MeshPhongMaterial({ color: "#f2c24a", emissive: "#5a3a00", emissiveIntensity: 0.4, specular: "#fff2c0", shininess: 60, side: THREE.DoubleSide }))); cb.position.y = 0.15; crown.add(cb);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; const pt = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 6), M.gold()); pt.position.set(Math.cos(a) * 0.4, 0.42, Math.sin(a) * 0.4); crown.add(pt); }
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), lam("gemRed", () => ({ color: "#d9342b" }))); gem.position.set(0, 0.16, 0.42); crown.add(gem);
  const iconM = new THREE.MeshBasicMaterial({ map: shipIcon(), transparent: true, alphaTest: 0.3, color: "#f2e6cc" });
  const markers = PORTS.map((_, i) => { const mk = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.255), iconM); mk.position.set(0, 0, 0.1); g.add(mk); return mk; });
  const rowY = (i: number) => y0 + h - (BOARD.rows0 + i * BOARD.rowH) * h;
  const place = (k: number, t: number) => markers.forEach((mk, i) => {
    const u = Math.max(0, Math.min(1, k * 1.5 - i * 0.1)), x0 = -w / 2 + BOARD.lineX0 * w, x1 = -w / 2 + BOARD.lineX1 * w;
    mk.position.set(x0 + (x1 - x0) * (u * u * (3 - 2 * u)), rowY(i) + 0.13 + 0.015 * Math.sin(t * 4 + i), 0.1); mk.rotation.z = 0.06 * Math.sin(t * 3 + i * 1.3);
  });
  return { g, place };
};
