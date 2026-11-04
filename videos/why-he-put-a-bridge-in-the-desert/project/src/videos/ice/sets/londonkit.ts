// London kit: brick + stone riverside warehouses (painted facades, lit windows through an emissive map, loading doors,
// hoist catheads, slate roofs + chimneys), far skyline silhouettes (a domed church, towers, spires), quay props
// (bollards, railings, lamp posts), the deal table + chairs, the easel price board, the FOR SALE banner, the tide
// gauge, the inspector's ruler, scene-4 dressing (pallet stacks of numbered blocks, tarpaulins, tool boxes,
// scaffold), fog cards and lamp reflection streaks on the water. Every key is prefixed "lon".
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { ctex, rng, jit, roofHD, beamHD, planksHD } from "../paint";
import { glow, mist } from "../setkit";
import { NOINK } from "../ink";
import { fitText } from "./portkit_common";
import { tarpTex } from "./londonkit_v";
import { cloth, Cloth } from "./towerkit";
import type { V3 } from "./types";

const TAU = Math.PI * 2;
const U = (r: () => number, a: number, b: number) => a + (b - a) * r();
const mesh = (parent: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, cast = true) => { const me = new THREE.Mesh(geo, m); me.castShadow = cast; me.receiveShadow = true; parent.add(me); return me; };

// ---------------- warehouse facades ----------------
export type WStyle = { wall: string; brick: boolean; floors: number; fh: number; gf: number; bayW: number; bays: number; trim: string; door: string; lit: number; arch: boolean };
export const WSTYLES: WStyle[] = [
  { wall: "#b39a72", brick: true, floors: 5, fh: 3.1, gf: 4.0, bayW: 4, bays: 4, trim: "#d8cdb6", door: "#2f4a3c", lit: 0.28, arch: true },   // yellow stock brick
  { wall: "#8e4a3a", brick: true, floors: 4, fh: 3.3, gf: 4.2, bayW: 4.5, bays: 4, trim: "#e2d6be", door: "#5a2e22", lit: 0.22, arch: true }, // red brick
  { wall: "#b9ae9a", brick: false, floors: 4, fh: 3.4, gf: 4.4, bayW: 4, bays: 4, trim: "#e6dcc8", door: "#2c3a52", lit: 0.3, arch: false },  // stucco / stone
  { wall: "#a58a64", brick: true, floors: 6, fh: 2.9, gf: 3.8, bayW: 3.6, bays: 5, trim: "#cfc4ac", door: "#3a3a2a", lit: 0.2, arch: false }, // tall stock brick
  { wall: "#7a4a3e", brick: true, floors: 3, fh: 3.4, gf: 4.0, bayW: 4, bays: 4, trim: "#d8ccb2", door: "#2f4a3c", lit: 0.35, arch: true },  // low red
  { wall: "#c2b498", brick: false, floors: 5, fh: 3.2, gf: 4.2, bayW: 4.2, bays: 4, trim: "#efe6d2", door: "#4a2f2a", lit: 0.25, arch: true }, // pale stone
];
export const styleH = (s: WStyle) => s.gf + s.floors * s.fh + 1.2;
const PXM = 32;
const facade = (si: number) => {
  const s = WSTYLES[si], wm = s.bays * s.bayW, hm = styleH(s), W = Math.round(wm * PXM), H = Math.round(hm * PXM), m = (v: number) => v * PXM;
  const lit: boolean[] = [];
  const seed = rng(si * 97 + 13);
  for (let i = 0; i < s.bays * (s.floors + 1); i++) lit.push(seed() < s.lit);
  const yOf = (fromBottom: number) => H - m(fromBottom);
  const win = (cx: number, by: number, ww: number, wh: number) => ({ x0: cx - m(ww) / 2, y0: yOf(by + wh), w: m(ww), h: m(wh) });
  const drawWindows = (g: CanvasRenderingContext2D, emis: boolean, r: () => number) => {
    let li = 0;
    for (let fl = 0; fl <= s.floors; fl++) for (let b = 0; b < s.bays; b++) {
      const cx = m((b + 0.5) * s.bayW), isLit = lit[li++];
      const loading = b === Math.floor(s.bays / 2);
      if (fl === 0) { // ground floor: big arched doorway / loading bay
        const dw = s.bayW * 0.62, dh = s.gf * 0.78, x0 = cx - m(dw) / 2, y1 = H, y0 = yOf(dh);
        const path = () => { g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0 + m(dw) / 2); g.arc(cx, y0 + m(dw) / 2, m(dw) / 2, Math.PI, 0); g.lineTo(x0 + m(dw), y1); g.closePath(); };
        if (emis) { if (isLit) { path(); g.fillStyle = "#e8a85a"; g.fill(); } continue; }
        path(); g.fillStyle = s.trim; g.save(); g.translate(cx, y1); g.scale(1.12, 1.04); g.translate(-cx, -y1); g.fill(); g.restore();
        path(); g.fillStyle = isLit ? "#d89a52" : s.door; g.fill();
        if (!isLit) { g.save(); path(); g.clip(); for (let x = x0; x < x0 + m(dw); x += m(0.16)) { g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(x, y0, 2, y1 - y0); g.fillStyle = "rgba(255,255,255,0.08)"; g.fillRect(x + 2, y0, 2, y1 - y0); } g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(cx - 1.5, y0, 3, y1 - y0); g.restore(); }
        else { g.fillStyle = "rgba(80,50,30,0.6)"; for (let k = 0; k < 3; k++) g.fillRect(x0 + m(0.2 + k * 0.7), y1 - m(0.9 + (k % 2) * 0.4), m(0.6), m(0.9 + (k % 2) * 0.4)); }
        continue;
      }
      const by = s.gf + (fl - 1) * s.fh + 0.55;
      if (loading) { // taking-in doors, one per floor
        const w0 = win(cx, by - 0.45, 1.5, s.fh * 0.82);
        if (emis) { if (isLit) { g.fillStyle = "#f0b464"; g.fillRect(w0.x0, w0.y0, w0.w, w0.h); } continue; }
        g.fillStyle = s.trim; g.fillRect(w0.x0 - m(0.12), w0.y0 - m(0.12), w0.w + m(0.24), w0.h + m(0.12));
        g.fillStyle = isLit ? "#e8a95e" : s.door; g.fillRect(w0.x0, w0.y0, w0.w, w0.h);
        if (!isLit) { g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(w0.x0 + w0.w / 2 - 1.5, w0.y0, 3, w0.h); g.strokeStyle = "rgba(255,255,255,0.18)"; g.lineWidth = 2; g.strokeRect(w0.x0 + 4, w0.y0 + 4, w0.w / 2 - 8, w0.h - 8); g.strokeRect(w0.x0 + w0.w / 2 + 4, w0.y0 + 4, w0.w / 2 - 8, w0.h - 8); }
        g.fillStyle = "rgba(40,30,30,0.7)"; g.fillRect(w0.x0 - m(0.2), w0.y0 + w0.h, w0.w + m(0.4), m(0.08));
        continue;
      }
      const ww = s.bayW * 0.36, wh = s.fh * 0.56, w0 = win(cx, by, ww, wh);
      const head = (k = 0) => { g.beginPath(); g.moveTo(w0.x0 - k, w0.y0 + w0.h + k); g.lineTo(w0.x0 - k, w0.y0 + m(0.2)); if (s.arch) g.quadraticCurveTo(cx, w0.y0 - m(0.25) - k, w0.x0 + w0.w + k, w0.y0 + m(0.2)); else g.lineTo(w0.x0 + w0.w + k, w0.y0 - k); g.lineTo(w0.x0 + w0.w + k, w0.y0 + w0.h + k); g.closePath(); };
      if (emis) { if (isLit) { head(); g.fillStyle = r() < 0.5 ? "#ffc870" : "#f6b060"; g.fill(); } continue; }
      // brick / stone arch head, frame, glass, panes, sill
      head(m(0.18)); g.fillStyle = s.brick ? "rgba(70,40,30,0.35)" : s.trim; g.fill();
      if (s.brick) { g.save(); head(m(0.18)); g.clip(); for (let k = -8; k < 8; k++) { g.strokeStyle = "rgba(240,220,190,0.25)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx + k * m(0.12), w0.y0 - m(0.5)); g.lineTo(cx + k * m(0.16), w0.y0 + m(0.3)); g.stroke(); } g.restore(); }
      head(); const gr = g.createLinearGradient(0, w0.y0, 0, w0.y0 + w0.h);
      if (isLit) { gr.addColorStop(0, "#ffd890"); gr.addColorStop(1, "#e69a50"); } else { gr.addColorStop(0, "#4a5690"); gr.addColorStop(1, "#2a3262"); }
      g.fillStyle = gr; g.fill();
      if (isLit && r() < 0.5) { g.fillStyle = "rgba(120,70,40,0.55)"; g.fillRect(w0.x0, w0.y0 + w0.h * 0.6, w0.w, w0.h * 0.4); }
      g.strokeStyle = isLit ? "rgba(90,50,30,0.8)" : "rgba(220,210,200,0.75)"; g.lineWidth = 2;
      for (let k = 1; k < 3; k++) { g.beginPath(); g.moveTo(w0.x0 + (w0.w * k) / 3, w0.y0 + m(0.1)); g.lineTo(w0.x0 + (w0.w * k) / 3, w0.y0 + w0.h); g.stroke(); }
      for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(w0.x0, w0.y0 + (w0.h * k) / 4); g.lineTo(w0.x0 + w0.w, w0.y0 + (w0.h * k) / 4); g.stroke(); }
      if (!isLit) { g.save(); head(); g.clip(); g.fillStyle = "rgba(255,255,255,0.14)"; g.save(); g.translate(w0.x0 + w0.w * 0.35, w0.y0 + w0.h / 2); g.rotate(0.7); g.fillRect(-m(0.08), -w0.h, m(0.16), w0.h * 2); g.restore(); g.restore(); }
      g.fillStyle = s.trim; g.fillRect(w0.x0 - m(0.12), w0.y0 + w0.h, w0.w + m(0.24), m(0.12));
      g.fillStyle = "rgba(40,30,30,0.35)"; g.fillRect(w0.x0 - m(0.12), w0.y0 + w0.h + m(0.12), w0.w + m(0.24), m(0.05));
      // soot streak under the sill
      if (!emis) { const sg = g.createLinearGradient(0, w0.y0 + w0.h, 0, w0.y0 + w0.h + m(1.4)); sg.addColorStop(0, "rgba(40,30,30,0.22)"); sg.addColorStop(1, "rgba(40,30,30,0)"); g.fillStyle = sg; g.fillRect(w0.x0, w0.y0 + w0.h + m(0.12), w0.w, m(1.4)); }
    }
  };
  const map = ctex("lonFac" + si, W, H, (g, r) => {
    g.fillStyle = s.wall; g.fillRect(0, 0, W, H);
    if (s.brick) { // brick courses: 0.075 m, header / stretcher tint variation
      const bh = m(0.075), bw = m(0.225);
      for (let y = 0, row = 0; y < H; y += bh, row++) for (let x = -(row % 2) * bw / 2; x < W; x += bw) {
        g.fillStyle = jit(r, s.wall, 0.12, 6, 0.2); g.fillRect(x + 0.5, y + 0.5, bw - 1, bh - 1);
      }
      g.fillStyle = "rgba(230,215,190,0.12)"; for (let y = 0; y < H; y += bh) g.fillRect(0, y, W, 0.8);
    } else {
      for (let fl = 0; fl < 40; fl++) { g.fillStyle = "rgba(90,80,70,0.16)"; g.fillRect(0, H - m(fl * 0.55), W, 1.2); }
      for (let i = 0; i < 40; i++) { const x = U(r, 0, W), y = U(r, 0, H), rad = U(r, 20, 70); const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, "rgba(255,255,255,0.08)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    }
    // string courses + cornice + plinth
    for (let fl = 0; fl <= s.floors; fl++) { const y = yOf(s.gf + fl * s.fh); g.fillStyle = s.trim; g.fillRect(0, y - m(0.14), W, m(0.22)); g.fillStyle = "rgba(40,30,30,0.3)"; g.fillRect(0, y + m(0.08), W, m(0.05)); }
    g.fillStyle = s.trim; g.fillRect(0, 0, W, m(0.5)); g.fillStyle = "rgba(40,30,30,0.35)"; g.fillRect(0, m(0.5), W, m(0.08));
    g.fillStyle = "rgba(50,40,40,0.35)"; g.fillRect(0, H - m(0.6), W, m(0.6));
    // pilasters between bays
    for (let b = 0; b <= s.bays; b++) { g.fillStyle = "rgba(255,240,220,0.07)"; g.fillRect(m(b * s.bayW) - m(0.25), m(0.5), m(0.5), H - m(1.1)); g.fillStyle = "rgba(40,30,30,0.12)"; g.fillRect(m(b * s.bayW) + m(0.22), m(0.5), m(0.06), H - m(1.1)); }
    drawWindows(g, false, r);
    // soot + rain streaks from the top, grime at the bottom
    for (let i = 0; i < 26; i++) { const x = U(r, 0, W), w = U(r, 6, 26), h = U(r, 60, H * 0.6); const gr = g.createLinearGradient(0, m(0.5), 0, m(0.5) + h); gr.addColorStop(0, "rgba(35,28,30,0.25)"); gr.addColorStop(1, "rgba(35,28,30,0)"); g.fillStyle = gr; g.fillRect(x, m(0.5), w, h); }
    const gg = g.createLinearGradient(0, H - m(3), 0, H); gg.addColorStop(0, "rgba(30,26,30,0)"); gg.addColorStop(1, "rgba(30,26,30,0.35)"); g.fillStyle = gg; g.fillRect(0, H - m(3), W, m(3));
  });
  const emis = ctex("lonFacE" + si, Math.round(W / 2), Math.round(H / 2), (g, r) => {
    g.fillStyle = "#000"; g.fillRect(0, 0, W / 2, H / 2); g.save(); g.scale(0.5, 0.5); drawWindows(g, true, r); g.restore();
  });
  return { map, emis, wm, hm };
};
const facMat = (si: number) => { const f = facade(si); return { m: lam("lonFacM" + si, () => ({ map: f.map, emissiveMap: f.emis, emissive: new THREE.Color(1.05, 0.95, 0.8) })), wm: f.wm, hm: f.hm }; };
const slate = () => lam("lonSlate", () => ({ map: roofHD("#5d6678", true) }));
const brickPlain = () => lam("lonBrickSide", () => ({ color: "#6e5a4a" }));
const chim = () => lam("lonChimney", () => ({ color: "#7a5444" }));
const potM = () => lam("lonPot", () => ({ color: "#b8684a" }));
const timber = () => lam("lonTimber", () => ({ map: beamHD() }));
/** riverside warehouse: front face (+z before yaw) and sides painted, base at y0; roof "gable" | "flat" (+ hoist house) */
export const warehouse = (b: Batch, x: number, z: number, yaw: number, w: number, d: number, si: number, y0: number, o: { roof?: "gable" | "flat"; seed?: number; cathead?: boolean; uOff?: number } = {}) => {
  const r = rng((o.seed ?? 1) * 53 + si * 7), F = facMat(si), h = F.hm, mtx = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y0, z);
  const hw = w / 2, hd = d / 2, ru = w / F.wm, rd = d / F.wm, u0 = o.uOff ?? Math.floor(r() * 4) * (1 / WSTYLES[si].bays);
  b.add(quad(V(-hw, 0, hd), V(hw, 0, hd), V(hw, h, hd), V(-hw, h, hd), u0 + ru, 1, u0, 0), F.m, mtx);
  b.add(quad(V(-hw, 0, -hd), V(-hw, 0, hd), V(-hw, h, hd), V(-hw, h, -hd), rd + 0.5, 1, 0.5, 0), F.m, mtx);
  b.add(quad(V(hw, 0, hd), V(hw, 0, -hd), V(hw, h, -hd), V(hw, h, hd), rd + 0.25, 1, 0.25, 0), F.m, mtx);
  b.add(quad(V(hw, 0, -hd), V(-hw, 0, -hd), V(-hw, h, -hd), V(hw, h, -hd), ru, 1), F.m, mtx);
  if ((o.roof ?? "gable") === "gable") {
    const rh = Math.min(5, d * 0.35), ov = 0.3;
    b.add(quad(V(-hw - ov, h, hd + ov), V(hw + ov, h, hd + ov), V(hw + ov, h + rh, 0), V(-hw - ov, h + rh, 0), w / 4, d / 7), slate(), mtx);
    b.add(quad(V(hw + ov, h, -hd - ov), V(-hw - ov, h, -hd - ov), V(-hw - ov, h + rh, 0), V(hw + ov, h + rh, 0), w / 4, d / 7), slate(), mtx);
    for (const sx of [-1, 1]) { const g = new THREE.BufferGeometry().setFromPoints([V(sx * hw, h, hd), V(sx * hw, h, -hd), V(sx * hw, h + rh, 0)]); g.setIndex(sx > 0 ? [0, 1, 2] : [0, 2, 1]); g.computeVertexNormals(); g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2)); b.add(g, brickPlain(), mtx); }
  } else {
    b.add(boxGeo(V(-hw, h - 0.01, -hd), V(hw, h + 0.05, hd)), lam("lonFlatRoof", () => ({ color: "#4a4a58" })), mtx);
    b.add(boxGeo(V(-1.6, h, hd - 4), V(1.6, h + 2.6, hd - 0.4)), brickPlain(), mtx); // hoist house
    b.add(boxGeo(V(-1.9, h + 2.6, hd - 4.3), V(1.9, h + 2.8, hd - 0.1)), lam("lonFlatRoof", () => ({ color: "#4a4a58" })), mtx);
  }
  // chimney stacks with pots
  for (let i = 0; i < 1 + Math.floor(w / 10); i++) {
    const cx = -hw + 1.5 + r() * (w - 3), cz = U(r, -hd * 0.6, hd * 0.6), ch = U(r, 2.2, 4.2);
    b.add(boxGeo(V(cx - 0.6, h, cz - 0.4), V(cx + 0.6, h + 3 + ch, cz + 0.4)), chim(), mtx);
    b.add(boxGeo(V(cx - 0.7, h + 3 + ch, cz - 0.5), V(cx + 0.7, h + 3.2 + ch, cz + 0.5)), chim(), mtx);
    for (let k = 0; k < 2; k++) b.add(new THREE.CylinderGeometry(0.15, 0.18, 0.6, 6).translate(cx - 0.3 + k * 0.6, h + 3.5 + ch, cz), potM(), mtx);
  }
  // cathead (hoist beam + hood) above the loading-door column
  if (o.cathead !== false) {
    const s = WSTYLES[si], bi = Math.floor(s.bays / 2), cx = -hw + ((bi + 0.5) * s.bayW - u0 * F.wm) % w;
    if (cx > -hw + 1 && cx < hw - 1) {
      b.add(boxGeo(V(cx - 0.12, h - 1.2, hd), V(cx + 0.12, h - 0.95, hd + 1.4)), timber(), mtx);
      b.add(quad(V(cx - 0.9, h - 0.4, hd + 1.5), V(cx + 0.9, h - 0.4, hd + 1.5), V(cx + 0.9, h + 0.6, hd), V(cx - 0.9, h + 0.6, hd), 1, 1), lam("lonHood", () => ({ color: "#3a3a44" })), mtx);
      b.add(new THREE.CylinderGeometry(0.012, 0.012, 6, 4).translate(cx, h - 4, hd + 1.3), lam("lonRope", () => ({ color: "#3a3028" })), mtx);
      b.add(new THREE.TorusGeometry(0.12, 0.03, 5, 10).translate(cx, h - 7, hd + 1.3), lam("lonIronK", () => ({ color: "#2f3238" })), mtx);
    }
  }
  return h;
};

// ---------------- far skyline (silhouettes in the fog) ----------------
export const skyline = (b: Batch, cx: number, z: number, y0: number, span: number, seed: number, o: { dome?: boolean } = {}) => {
  const r = rng(seed), m = lam("lonFar" + seed % 3, () => ({ color: ["#4b5584", "#454e7c", "#525c8a"][seed % 3], emissiveMap: farLitTex(), emissive: new THREE.Color(0.7, 0.6, 0.45) }));
  for (let x = cx - span / 2; x < cx + span / 2;) {
    const w = U(r, 8, 22), h = U(r, 10, 30), d = U(r, 10, 20);
    const g = boxGeo(V(x, y0, z - d), V(x + w, y0 + h, z));
    const uv = g.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 16 + r(), uv.getY(i) * h / 16);
    b.add(g, m);
    if (r() < 0.3) b.add(new THREE.ConeGeometry(U(r, 1.5, 3), U(r, 12, 24), 6).translate(x + w / 2, y0 + h + 6, z - d / 2), m);
    if (r() < 0.4) b.add(boxGeo(V(x + w * 0.3, y0 + h, z - 3), V(x + w * 0.3 + 1.2, y0 + h + U(r, 4, 9), z - 1.8)), m);
    x += w + U(r, -2, 3);
  }
  if (o.dome) { // the domed church: drum, ribbed dome, lantern, two west towers
    const dm = lam("lonDome", () => ({ color: "#56609a" }));
    const X = cx, Z = z - 30, Y = y0;
    b.add(boxGeo(V(X - 30, Y, Z - 24), V(X + 30, Y + 26, Z + 24)), m);
    b.add(new THREE.CylinderGeometry(15, 16, 16, 28).translate(X, Y + 34, Z), dm);
    b.add(new THREE.CylinderGeometry(17, 17, 2, 28).translate(X, Y + 42.5, Z), dm);
    b.add(new THREE.SphereGeometry(15.5, 28, 14, 0, TAU, 0, Math.PI / 2).scale(1, 1.15, 1).translate(X, Y + 43, Z), dm);
    b.add(new THREE.CylinderGeometry(2.6, 3, 7, 12).translate(X, Y + 63, Z), dm);
    b.add(new THREE.SphereGeometry(2.4, 12, 8).translate(X, Y + 68, Z), dm);
    b.add(new THREE.ConeGeometry(0.8, 6, 8).translate(X, Y + 72, Z), dm);
    for (const s of [-1, 1]) { b.add(boxGeo(V(X + s * 26 - 4, Y + 26, Z + 18), V(X + s * 26 + 4, Y + 44, Z + 26)), dm); b.add(new THREE.ConeGeometry(4.5, 8, 4).rotateY(Math.PI / 4).translate(X + s * 26, Y + 48, Z + 22), dm); }
  }
};
const farLitTex = () => ctex("lonFarLit", 256, 256, (g, r) => {
  g.fillStyle = "#000"; g.fillRect(0, 0, 256, 256);
  for (let y = 10; y < 256; y += 20) for (let x = 6; x < 256; x += 16) if (r() < 0.16) { g.fillStyle = r() < 0.5 ? "#ffcf80" : "#f0b060"; g.fillRect(x, y, 6, 9); }
});

// ---------------- props ----------------
export const iron = () => lam("lonIron", () => ({ color: "#2e3436" }));
export const bollard = (b: Batch, x: number, y: number, z: number) => {
  b.add(new THREE.CylinderGeometry(0.2, 0.26, 0.7, 12).translate(x, y + 0.35, z), iron());
  b.add(new THREE.SphereGeometry(0.24, 12, 8, 0, TAU, 0, Math.PI / 2).translate(x, y + 0.7, z), iron());
  b.add(new THREE.TorusGeometry(0.24, 0.04, 6, 14).rotateX(Math.PI / 2).translate(x, y + 0.6, z), iron());
};
/** iron quay railing between two points (posts every ~1.8 m, two rails, ball finials) */
export const railing = (b: Batch, a: V3, c: V3, h = 1.05) => {
  const A = V(...a), C = V(...c), L = A.distanceTo(C), n = Math.max(1, Math.round(L / 1.8)), dir = C.clone().sub(A).normalize();
  for (let i = 0; i <= n; i++) { const p = A.clone().lerp(C, i / n); b.add(new THREE.CylinderGeometry(0.035, 0.045, h, 6).translate(p.x, p.y + h / 2, p.z), iron()); b.add(new THREE.SphereGeometry(0.06, 8, 6).translate(p.x, p.y + h + 0.03, p.z), iron()); }
  const yaw = Math.atan2(dir.x, dir.z), mid = A.clone().add(C).multiplyScalar(0.5);
  for (const y of [h * 0.45, h - 0.04]) b.add(new THREE.BoxGeometry(0.04, 0.04, L).rotateY(yaw).translate(mid.x, mid.y + y, mid.z), iron());
};
/** London iron lamp post with a lantern (glow; optional point light) */
export const lampPostL = (b: Batch, parent: THREE.Object3D, x: number, y: number, z: number, h = 4.4, light = 0) => {
  const ir = iron();
  b.add(new THREE.CylinderGeometry(0.2, 0.26, 0.5, 10).translate(x, y + 0.25, z), ir);
  b.add(new THREE.CylinderGeometry(0.06, 0.1, h - 0.5, 10).translate(x, y + 0.5 + (h - 0.5) / 2, z), ir);
  for (const yy of [1.0, 1.15, h - 0.4]) b.add(new THREE.TorusGeometry(0.1, 0.03, 6, 12).rotateX(Math.PI / 2).translate(x, y + yy, z), ir);
  b.add(new THREE.BoxGeometry(0.7, 0.05, 0.05).translate(x, y + h - 0.55, z), ir); // ladder bar
  b.add(new THREE.CylinderGeometry(0.2, 0.13, 0.08, 6).translate(x, y + h + 0.04, z), ir);
  b.add(new THREE.ConeGeometry(0.27, 0.28, 6).translate(x, y + h + 0.72, z), ir);
  b.add(new THREE.SphereGeometry(0.05, 6, 5).translate(x, y + h + 0.9, z), ir);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.15, 0.52, 6, 1, true).translate(x, y + h + 0.34, z), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffc67a").multiplyScalar(1.8) }));
  parent.add(glass);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; b.add(new THREE.BoxGeometry(0.025, 0.55, 0.025).translate(x + Math.cos(a) * 0.2, y + h + 0.34, z + Math.sin(a) * 0.2), ir); }
  const gl = glow(parent, [x, y + h + 0.34, z], "#ffbf70", 2.4, 0.8);
  let L: THREE.PointLight | null = null;
  if (light > 0) { L = new THREE.PointLight("#ffb466", light, 14, 1.3); L.position.set(x, y + h + 0.2, z); parent.add(L); }
  return { glass, glow: gl, light: L };
};
/** reflection streak of a light on the water (horizontal additive card, long along `dir`) */
const streakTex = () => ctex("lonStreak", 64, 512, (g, r) => {
  for (let y = 0; y < 512; y += 6) {
    const k = 1 - y / 512, w = 64 * (0.3 + 0.7 * r()) * (0.4 + 0.6 * k), a = (0.25 + 0.75 * r()) * k * k;
    const gr = g.createLinearGradient(32 - w / 2, 0, 32 + w / 2, 0); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, y, 64, 3 + r() * 2);
  }
});
export const streak = (parent: THREE.Object3D, x: number, z: number, len: number, dirZ: number, col = "#ffc070", k = 1, w = 1.0) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: streakTex(), color: new THREE.Color(col).multiplyScalar(k), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true }));
  if (dirZ < 0) m.rotation.y = Math.PI;
  m.position.set(x, 0.03, z + (dirZ * len) / 2); m.layers.set(NOINK); m.renderOrder = 3; parent.add(m); return m;
};

// ---------------- deal table, chairs, easel price board, banner ----------------
export const dealTable = (parent: THREE.Object3D, x: number, y: number, z: number) => {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const wood = lam("lonTableWood", () => ({ color: "#6e4430" })), baize = lam("lonBaize", () => ({ map: clothTex() }));
  mesh(g, new THREE.BoxGeometry(1.0, 0.05, 0.72).translate(0, 0.74, 0), wood);
  mesh(g, new THREE.BoxGeometry(1.04, 0.012, 0.76).translate(0, 0.772, 0), baize);
  // cloth drop on the front and back
  for (const s of [-1, 1]) mesh(g, new THREE.BoxGeometry(1.04, 0.26, 0.012).translate(0, 0.65, s * 0.38), baize);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(g, new THREE.CylinderGeometry(0.03, 0.025, 0.72, 8).translate(sx * 0.44, 0.36, sz * 0.3), wood);
  // inkwell + pen, a stack of papers (cake goes in the middle: leave 0.4 m clear)
  mesh(g, new THREE.CylinderGeometry(0.04, 0.045, 0.06, 10).translate(0.38, 0.81, -0.22), lam("lonInk", () => ({ color: "#2a3050" })));
  mesh(g, new THREE.CylinderGeometry(0.006, 0.006, 0.2, 5).rotateZ(0.6).translate(0.34, 0.85, -0.2), lam("lonPen", () => ({ color: "#d9b04a" })));
  for (let i = 0; i < 4; i++) mesh(g, new THREE.BoxGeometry(0.22, 0.008, 0.3).rotateY(i * 0.07 - 0.1).translate(-0.36, 0.782 + i * 0.008, -0.18), lam("lonPaper", () => ({ color: "#f2ecdc" })), false);
  return g;
};
const clothTex = () => ctex("lonBaizeT", 256, 256, (g, r) => { g.fillStyle = "#2f6a4a"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 1200; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"; g.fillRect(r() * 256, r() * 256, 2, 2); } g.strokeStyle = "#e0c060"; g.lineWidth = 6; g.strokeRect(10, 10, 236, 236); });
/** folding café chair facing +x before yaw */
export const chair = (parent: THREE.Object3D, x: number, y: number, z: number, yaw: number) => {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; parent.add(g);
  const wood = lam("lonChairWood", () => ({ color: "#7a4e34" }));
  mesh(g, new THREE.BoxGeometry(0.42, 0.04, 0.42).translate(0, 0.46, 0), wood);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(g, new THREE.CylinderGeometry(0.018, 0.018, 0.46, 6).translate(sx * 0.18, 0.23, sz * 0.18), wood);
  for (const sz of [-1, 1]) mesh(g, new THREE.CylinderGeometry(0.018, 0.018, 0.5, 6).translate(-0.19, 0.71, sz * 0.18), wood);
  for (const yy of [0.62, 0.78, 0.92]) mesh(g, new THREE.BoxGeometry(0.03, 0.07, 0.4).translate(-0.19, yy, 0), wood);
  return g;
};
const priceTex = () => ctex("lonPriceBoard", 768, 512, (g) => {
  g.fillStyle = "#f3e9cf"; g.fillRect(0, 0, 768, 512);
  g.strokeStyle = "#7a2a24"; g.lineWidth = 14; g.strokeRect(20, 20, 728, 472); g.lineWidth = 3; g.strokeRect(40, 40, 688, 432);
  g.fillStyle = "#2a2230"; g.textAlign = "center"; g.textBaseline = "middle";
  fitText(g, "TAKING IT APART:", 384, 170, 620, 96, "900 %spx Georgia, serif");
  g.fillStyle = "#b3262e"; fitText(g, "$1,200,000", 384, 330, 640, 150, "900 %spx Georgia, serif");
  g.fillStyle = "rgba(60,40,30,0.5)"; g.fillRect(150, 418, 468, 4);
});
/** A-frame easel with the price board, facing +z before yaw (board centre ~1.35 m) */
export const priceBoard = (parent: THREE.Object3D, x: number, y: number, z: number, yaw: number) => {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; parent.add(g);
  const wood = lam("lonEaselWood", () => ({ map: beamHD() }));
  const leg = (a: V3, c: V3) => { const A = V(...a), C = V(...c), m = mesh(g, new THREE.BoxGeometry(0.05, A.distanceTo(C), 0.04), wood); m.position.copy(A.clone().add(C).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(V(0, 1, 0), C.clone().sub(A).normalize()); };
  leg([-0.5, 0, 0.12], [-0.12, 1.95, 0]); leg([0.5, 0, 0.12], [0.12, 1.95, 0]); leg([0, 0, -0.55], [0, 1.85, -0.04]);
  mesh(g, new THREE.BoxGeometry(1.1, 0.05, 0.1).translate(0, 0.86, 0.12), wood);
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.87, 0.04), [wood, wood, wood, wood, new THREE.MeshBasicMaterial({ map: priceTex(), color: new THREE.Color(0.82, 0.82, 0.86) }), wood]);
  board.position.set(0, 1.33, 0.16); board.rotation.x = -0.1; board.castShadow = true; g.add(board);
  return g;
};
const saleTex = () => ctex("lonForSaleV", 600, 800, (g, r) => {
  g.fillStyle = "#f4ecd8"; g.fillRect(0, 0, 600, 800);
  for (let i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? "rgba(120,100,70,0.06)" : "rgba(255,255,255,0.08)"; g.fillRect(r() * 600, r() * 800, 3 + r() * 20, 1); }
  g.fillStyle = "#b3262e"; g.fillRect(0, 0, 600, 30); g.fillRect(0, 770, 600, 30);
  g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#b3262e";
  fitText(g, "FOR", 300, 255, 500, 270, "900 %spx Georgia, serif"); fitText(g, "SALE", 300, 560, 540, 270, "900 %spx Georgia, serif");
  g.fillStyle = "rgba(60,30,20,0.25)"; for (const x of [40, 560]) { g.beginPath(); g.arc(x, 64, 10, 0, TAU); g.fill(); }
});
/** big hanging cloth banner (w x h) facing +z, top edge at (x, y, z); gentle billow from pose */
export const saleBanner = (parent: THREE.Object3D, x: number, y: number, z: number, w: number, h: number): Cloth => {
  const m = lam("lonSaleM", () => ({ map: saleTex(), emissiveMap: saleTex(), emissive: new THREE.Color(0.42, 0.38, 0.34), side: THREE.DoubleSide }));
  const c = cloth(parent, w, h, m, 0.12, 3, 8);
  c.m.position.set(x - w / 2, y, z); c.m.castShadow = true;
  return c;
};

// ---------------- tide gauge + the inspector's ruler ----------------
const gaugeTex = () => ctex("lonGauge", 128, 1024, (g) => {
  g.clearRect(0, 0, 128, 1024);
  // 4 m of painted marks: a tick every 0.1 m, a long bar every 0.5 m, numbers every metre (feet-ish labels)
  for (let i = 0; i <= 40; i++) {
    const y = 1024 - (i / 40) * 1024, big = i % 5 === 0;
    g.fillStyle = "rgba(250,248,236,0.92)"; g.fillRect(0, y - (big ? 5 : 3), big ? 96 : 48, big ? 10 : 6);
  }
  g.font = "900 44px 'DejaVu Sans Condensed', 'DejaVu Sans', sans-serif"; g.textAlign = "right"; g.textBaseline = "middle";
  for (let mtr = 1; mtr < 4; mtr++) { g.fillStyle = "rgba(250,248,236,0.92)"; g.fillText(String(mtr * 3), 124, 1024 - (mtr / 4) * 1024 - 28); }
});
/** painted level marks on a pier face: plane in the wall (normal n), bottom at y0 */
export const gauge = (parent: THREE.Object3D, p: V3, n: V3, y0 = -0.6, h = 4) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, h), lam("lonGaugeM", () => ({ map: gaugeTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })));
  m.position.set(p[0] + n[0] * 0.03, y0 + h / 2, p[2] + n[2] * 0.03); m.lookAt(m.position.x + n[0], m.position.y, m.position.z + n[2]); m.renderOrder = 2; parent.add(m);
  return m;
};
const rulerTex = () => ctex("lonRuler", 64, 1024, (g) => {
  g.fillStyle = "#f3e7c2"; g.fillRect(0, 0, 64, 1024);
  for (let i = 0; i < 35; i++) { const y = 1024 - (i / 35) * 1024; g.fillStyle = i % 2 ? "#f3e7c2" : "#c8352e"; g.fillRect(0, y - 1024 / 35, 64, 1024 / 35); }
  g.fillStyle = "#1e1a24"; for (let i = 0; i <= 70; i++) { const y = 1024 - (i / 70) * 1024; g.fillRect(0, y - 1, i % 2 ? 18 : 34, 2.5); }
});
/** a 3.5 m painted measuring staff standing at p, leaning by `lean` rad around x after yaw */
export const ruler = (parent: THREE.Object3D, p: V3, yaw = 0, lean = 0) => {
  const g = new THREE.Group(); g.position.set(...p); g.rotation.set(0, yaw, 0); parent.add(g);
  const st = new THREE.Mesh(new THREE.BoxGeometry(0.09, 3.5, 0.04).translate(0, 1.75, 0), [lam("lonRulerSide", () => ({ color: "#d9c79a" })), lam("lonRulerSide", () => ({ color: "#d9c79a" })), lam("lonRulerSide", () => ({ color: "#d9c79a" })), lam("lonRulerSide", () => ({ color: "#d9c79a" })), lam("lonRulerFace", () => ({ map: rulerTex() })), lam("lonRulerFace", () => ({ map: rulerTex() }))]);
  st.rotation.x = lean; st.castShadow = true; g.add(st);
  return g;
};

// ---------------- scene-4 dressing ----------------
const blockTex = (i: number) => ctex("lonBlock" + i, 256, 160, (g, r) => {
  g.fillStyle = jit(r, "#b5ada2", 0.08, 5, 0.2); g.fillRect(0, 0, 256, 160);
  for (let k = 0; k < 600; k++) { const c = r(); g.fillStyle = c < 0.45 ? "rgba(70,66,70,0.45)" : c < 0.75 ? "rgba(150,146,148,0.4)" : "rgba(255,255,252,0.5)"; g.fillRect(r() * 256, r() * 160, 1.6, 1.6); }
  for (let k = 0; k < 3; k++) { const x = r() * 256, w = 8 + r() * 14, gr = g.createLinearGradient(0, 0, 0, 120); gr.addColorStop(0, "rgba(50,44,44,0.3)"); gr.addColorStop(1, "rgba(50,44,44,0)"); g.fillStyle = gr; g.fillRect(x, 0, w, 120); }
  g.strokeStyle = "rgba(255,252,246,0.35)"; g.lineWidth = 5; g.beginPath(); g.moveTo(3, 157); g.lineTo(3, 3); g.lineTo(253, 3); g.stroke();
  g.strokeStyle = "rgba(50,44,44,0.4)"; g.beginPath(); g.moveTo(253, 3); g.lineTo(253, 157); g.lineTo(3, 157); g.stroke();
  const txt = `${1 + (i % 5)}-${3 + ((i * 7) % 16)}-${100 + ((i * 53) % 540)}`;
  g.fillStyle = "#fbfaf4"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, txt, 128, 84, 200, 60, "900 %spx 'DejaVu Sans Condensed', 'DejaVu Sans', sans-serif");
  g.globalCompositeOperation = "destination-over";
});
const blockMat = (i: number) => lam("lonBlockM" + (i % 8), () => ({ map: blockTex(i % 8) }));
const palletM = () => lam("lonPallet", () => ({ map: planksHD(), color: "#c8a678" }));
/** pallet with granite blocks: n x m footprint of blocks (0.85 x 0.5 x 0.55), `layers` high, yaw */
export const blockStack = (parent: THREE.Object3D, x: number, y: number, z: number, yaw: number, layers: number, seed: number, cover = false) => {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; parent.add(g);
  const b = new Batch(), r = rng(seed), pm = palletM();
  for (const zz of [-0.5, 0, 0.5]) b.add(boxGeo(V(-0.9, 0, zz - 0.06), V(0.9, 0.1, zz + 0.06), 0.6), pm);
  for (let i = 0; i < 7; i++) b.add(boxGeo(V(-0.9 + i * 0.27, 0.1, -0.6), V(-0.9 + i * 0.27 + 0.2, 0.14, 0.6), 0.6), pm);
  let top = 0.14;
  for (let l = 0; l < layers; l++) {
    const h = 0.48;
    for (const zz of [-0.3, 0.3]) for (const xx of [-0.45, 0.45]) {
      if (l === layers - 1 && r() < 0.25) continue;
      const w = U(r, 0.78, 0.86), d = U(r, 0.52, 0.56), bi = Math.floor(r() * 8), m = blockMat(bi);
      const gm = new THREE.BoxGeometry(w, h - 0.02, d).translate(xx + U(r, -0.02, 0.02), top + h / 2, zz);
      gm.rotateY(U(r, -0.03, 0.03));
      b.add(gm, m);
    }
    top += h;
  }
  b.build(g);
  if (cover) mesh(g, new RoundedBoxGeometry(1.95, top + 0.1, 1.35, 2, 0.12).translate(0, (top + 0.1) / 2 - 0.04, 0), lam("lonTarpBlue", () => ({ map: tarpTex("#3c5a86") })));
  return { g, top };
};
export const toolBox = (parent: THREE.Object3D, x: number, y: number, z: number, yaw: number) => {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; parent.add(g);
  const wood = lam("lonToolBox", () => ({ color: "#8a5a34" })), ir = iron();
  mesh(g, new THREE.BoxGeometry(0.7, 0.28, 0.32).translate(0, 0.14, 0), wood);
  for (const s of [-1, 1]) mesh(g, new THREE.BoxGeometry(0.03, 0.3, 0.3).translate(s * 0.34, 0.36, 0), wood);
  mesh(g, new THREE.CylinderGeometry(0.018, 0.018, 0.68, 6).rotateZ(Math.PI / 2).translate(0, 0.5, 0), wood);
  mesh(g, new THREE.CylinderGeometry(0.015, 0.015, 0.4, 5).rotateZ(1.3).translate(0.05, 0.34, 0.06), ir); // chisel
  mesh(g, new THREE.BoxGeometry(0.14, 0.06, 0.06).translate(-0.12, 0.33, -0.05), ir); // hammer head
  mesh(g, new THREE.CylinderGeometry(0.018, 0.018, 0.3, 5).rotateZ(Math.PI / 2 - 0.3).translate(-0.02, 0.32, -0.05), wood);
  return g;
};
export const tarpHeap = (parent: THREE.Object3D, x: number, y: number, z: number, yaw: number, col = "#5a7a4a") => {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; parent.add(g);
  const geo = new THREE.SphereGeometry(0.7, 14, 8, 0, TAU, 0, Math.PI / 2).scale(1.4, 0.35, 0.9);
  const p = geo.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) * (1 + 0.25 * Math.sin(p.getX(i) * 7) * Math.cos(p.getZ(i) * 5)));
  geo.computeVertexNormals();
  mesh(g, geo, lam("lonTarpH" + col, () => ({ map: tarpTex(col) })));
  return g;
};
/** tube-and-board scaffold: x0..x1 along x, z0..z1, from y0 up to y1 in lifts of ~2 m */
export const scaffold = (parent: THREE.Object3D, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number) => {
  const b = new Batch(), tube = lam("lonTube", () => ({ color: "#8f969c" })), board = lam("lonBoard", () => ({ map: planksHD(), color: "#d6b888" }));
  const nx = Math.max(1, Math.round((x1 - x0) / 2.2)), dx = (x1 - x0) / nx;
  const lifts: number[] = []; for (let y = y0 + 2.0; y < y1 - 0.5; y += 2.0) lifts.push(y);
  for (let i = 0; i <= nx; i++) for (const z of [z0, z1]) b.add(new THREE.CylinderGeometry(0.03, 0.03, y1 - y0, 6).translate(x0 + i * dx, (y0 + y1) / 2, z), tube);
  for (const y of [...lifts, y1 - 0.1]) {
    for (const z of [z0, z1]) b.add(new THREE.CylinderGeometry(0.028, 0.028, x1 - x0, 6).rotateZ(Math.PI / 2).translate((x0 + x1) / 2, y, z), tube);
    for (let i = 0; i <= nx; i++) b.add(new THREE.CylinderGeometry(0.028, 0.028, z1 - z0 + 0.3, 6).rotateX(Math.PI / 2).translate(x0 + i * dx, y, (z0 + z1) / 2), tube);
    if (y < y1 - 0.2) { b.add(boxGeo(V(x0, y + 0.03, z0 + 0.05), V(x1, y + 0.08, z1 - 0.05), 1), board); for (const z of [z0, z1]) b.add(new THREE.CylinderGeometry(0.025, 0.025, x1 - x0, 6).rotateZ(Math.PI / 2).translate((x0 + x1) / 2, y + 1.0, z), tube); }
  }
  for (let i = 0; i < nx; i++) { // diagonal braces on the outer face
    const a = V(x0 + i * dx, y0, z1), c = V(x0 + (i + 1) * dx, Math.min(y1, y0 + 4), z1), L = a.distanceTo(c), mid = a.clone().add(c).multiplyScalar(0.5);
    const geo = new THREE.CylinderGeometry(0.025, 0.025, L, 6); geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize())); geo.translate(mid.x, mid.y, mid.z); b.add(geo, tube);
  }
  // a ladder
  const lx = x0 + dx * 0.5, lz = (z0 + z1) / 2;
  for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.05, 2.3, 0.05).rotateX(0.25).translate(lx + s * 0.22, y0 + 1.1, lz + 0.3), timber());
  for (let k = 0; k < 7; k++) b.add(new THREE.BoxGeometry(0.44, 0.035, 0.035).translate(lx, y0 + 0.25 + k * 0.3, lz + 0.58 - k * 0.075), timber());
  b.build(parent);
};
/** low barrier along the open deck edge (posts + a sagging rope + a few red flags) */
export const ropeBarrier = (parent: THREE.Object3D, a: V3, c: V3) => {
  const b = new Batch(), post = lam("lonBarPost", () => ({ color: "#d9c27a" })), rope = lam("lonBarRope", () => ({ color: "#c94a2e" }));
  const A = V(...a), C = V(...c), n = Math.max(1, Math.round(A.distanceTo(C) / 2.4));
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) { const p = A.clone().lerp(C, i / n); pts.push(p); b.add(new THREE.CylinderGeometry(0.035, 0.04, 1.0, 6).translate(p.x, p.y + 0.5, p.z), post); b.add(new THREE.CylinderGeometry(0.16, 0.18, 0.06, 8).translate(p.x, p.y + 0.03, p.z), post); }
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[i + 1];
    for (let k = 0; k < 8; k++) {
      const u0 = k / 8, u1 = (k + 1) / 8, s0 = 0.12 * Math.sin(Math.PI * u0), s1 = 0.12 * Math.sin(Math.PI * u1);
      const a2 = p.clone().lerp(q, u0).setY(p.y + 0.95 - s0), c2 = p.clone().lerp(q, u1).setY(p.y + 0.95 - s1), L = a2.distanceTo(c2), mid = a2.clone().add(c2).multiplyScalar(0.5);
      const geo = new THREE.CylinderGeometry(0.014, 0.014, L, 4); geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c2.clone().sub(a2).normalize())); geo.translate(mid.x, mid.y, mid.z); b.add(geo, rope);
    }
    const m = p.clone().lerp(q, 0.5); b.add(new THREE.BufferGeometry().setFromPoints([V(m.x - 0.12, m.y + 0.83, m.z), V(m.x + 0.12, m.y + 0.83, m.z), V(m.x, m.y + 0.62, m.z)]).setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2)), lam("lonFlagRed", () => ({ color: "#d23a2e", side: THREE.DoubleSide })));
  }
  b.build(parent, false);
};
/** soft fog bank card (big camera-facing mist) */
export const fogBank = (parent: THREE.Object3D, pos: V3, size: number, op = 0.35, col = "#7d8cc4") => { const m = mist(parent, pos, size, col, op); m.scale.set(size, size * 0.32, 1); return m; };
export { glow, mist };
