// Kit for "The Thieves Who Stole 200 Shoes Nobody Can Wear" (2026-11-23, master prompt v27): code-modelled sneakers
// (real proportions: a bevelled sole, a shaped upper with a heel collar, laces and a stripe on the OUTER side only, so
// a pair of two right shoes reads as wrong), shoe boxes, a metal-spoked cargo tricycle, a roll-up shutter, a padlock,
// a street clock and a glove. Everything is ORIGINAL.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ctex } from "../paint";
import { phMat, boxM } from "../ph";
import { fitText } from "./portkit_common";
import { TAU, cl, lerp, hsh, col, cylM, SERIF } from "./mailkit";
import type { V3 } from "./types";

// ---------------- sneakers ----------------
export const SHOE = { L: 0.29, W: 0.105 };
/** top-view outline of a RIGHT sneaker, toe toward +x; +z is the outer (lateral) side, -z the inner side with the arch */
/** half-widths of a RIGHT sneaker at u (0 heel .. 1 toe): outer (+z, lateral) and inner (-z, medial, with the arch) */
const halfW = (u: number, k = 1): [number, number] => {
  const W = SHOE.W * k, base = W / 2 * (0.82 + 0.18 * Math.sin(Math.PI * Math.min(1, u * 1.25)));
  const endT = u > 0.84 ? Math.sqrt(Math.max(0.02, 1 - ((u - 0.84) / 0.16) ** 2)) : 1, endH = u < 0.1 ? Math.sqrt(Math.max(0.05, 1 - ((0.1 - u) / 0.1) ** 2)) : 1;
  const arch = 0.28 * Math.exp(-(((u - 0.45) / 0.14) ** 2)), toeIn = u > 0.7 ? (u - 0.7) * 0.25 : 0;
  return [base * endT * endH * (1 - toeIn), base * (1 - arch + toeIn * 0.6) * endT * endH];
};
const outline = (k = 1): [number, number][] => {
  const pts: [number, number][] = [], N = 40, L = SHOE.L * k;
  for (let i = 0; i <= N; i++) { const u = i / N; pts.push([lerp(-L / 2, L / 2, u), halfW(u, k)[0]]); }
  for (let i = N; i >= 0; i--) { const u = i / N; pts.push([lerp(-L / 2, L / 2, u), -halfW(u, k)[1]]); }
  return pts;
};
const extrudeUp = (pts: [number, number][], depth: number, bevel: number) => {
  const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 3, steps: 2, curveSegments: 8 });
  g.rotateX(-Math.PI / 2);
  return g;
};
let SNEAKER: { upper: THREE.BufferGeometry; sole: THREE.BufferGeometry; trim: THREE.BufferGeometry } | null = null;
const PROF: [number, number][] = [[0, 0.07], [0.06, 0.084], [0.2, 0.066], [0.33, 0.086], [0.5, 0.066], [0.7, 0.047], [0.86, 0.036], [1, 0.024]];
const profU = (u: number) => { let i = 0; while (i < PROF.length - 2 && u > PROF[i + 1][0]) i++; const [u0, a] = PROF[i], [u1, b] = PROF[i + 1], k = cl((u - u0) / (u1 - u0)); return lerp(a, b, k * k * (3 - 2 * k)); };
/** toe spring: the front of the shoe curves up */
const spring = (x: number) => { const u = x / SHOE.L + 0.5; return u > 0.78 ? (u - 0.78) ** 2 * 0.32 : 0; };
/** the upper as a smooth loft: 44 stations heel -> toe, each a full-bodied arch from the outer sole edge over the top
 *  to the inner edge; the ankle opening is a dark pit; vertex colours darken the opening and the heel counter. */
export const sneakerGeo = () => {
  if (SNEAKER) return SNEAKER;
  const soleH = 0.022, NS = 44, NM = 18;
  const sole = extrudeUp(outline(1.03), soleH - 0.006, 0.003); sole.translate(0, 0.003, 0);
  { const q = sole.attributes.position as THREE.BufferAttribute; for (let i = 0; i < q.count; i++) q.setY(i, q.getY(i) + spring(q.getX(i))); sole.computeVertexNormals(); }
  const pos: number[] = [], colr: number[] = [], idx: number[] = [];
  const uAt = (i: number) => 0.5 - 0.5 * Math.cos((Math.PI * i) / (NS - 1));
  const y0 = soleH - 0.004;
  const surf = (u: number, th: number): [number, number, number, number] => {
    const [wo, wi] = halfW(u, 0.98), h = profU(u), c = Math.cos(th), sn = Math.sin(th);
    let z = (c >= 0 ? wo : -wi) * Math.pow(Math.abs(c), 0.55), y = y0 + h * Math.pow(sn, 0.42), shade = 1;
    // ankle opening: an ellipse in (u, th) around the top of the heel
    const s = 1 - ((u - 0.2) / 0.13) ** 2;
    if (s > 0) { const half = 0.62 * Math.sqrt(s), d = Math.abs(th - Math.PI / 2), k = 1 - cl((d - half * 0.55) / (half * 0.6 + 0.08)), kk = k * k * (3 - 2 * k);
      y -= h * 0.4 * kk; z *= 1 - 0.22 * kk; shade = lerp(1, 0.13, kk);
      const rim = Math.exp(-(((d - half * 1.05) / 0.12) ** 2)); y += 0.003 * rim * (1 - kk); }
    if (u < 0.12 && sn < 0.8) shade *= 0.82;   // heel counter
    const x = (u - 0.5) * SHOE.L;
    return [x, y + spring(x), z, shade];
  };
  for (let i = 0; i < NS; i++) for (let j = 0; j <= NM; j++) { const [x, y, z, c] = surf(uAt(i), (Math.PI * j) / NM); pos.push(x, y, z); colr.push(c, c, c); }
  for (let i = 0; i < NS - 1; i++) for (let j = 0; j < NM; j++) { const a = i * (NM + 1) + j, b = a + NM + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  // end caps (heel back, toe tip): fans to the section centre
  for (const i of [0, NS - 1]) { const c0 = pos.length / 3; let cx = 0, cy = 0; for (let j = 0; j <= NM; j++) { cx += pos[(i * (NM + 1) + j) * 3]; cy += pos[(i * (NM + 1) + j) * 3 + 1]; }
    pos.push(cx / (NM + 1), y0 + (cy / (NM + 1) - y0) * 0.6, 0); colr.push(1, 1, 1);
    for (let j = 0; j < NM; j++) { const a = i * (NM + 1) + j; if (i === 0) idx.push(c0, a + 1, a); else idx.push(c0, a, a + 1); } }
  const up = new THREE.BufferGeometry(); up.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); up.setAttribute("color", new THREE.Float32BufferAttribute(colr, 3)); up.setIndex(idx); up.computeVertexNormals();
  // surface z on the OUTER side at (u, y) (inverse of the arch), for the trim
  const zOut = (u: number, y: number) => { const h = profU(u), t = cl((y - y0) / h, 0, 0.999), th = Math.asin(Math.pow(t, 1 / 0.42)); return halfW(u, 0.98)[0] * Math.pow(Math.cos(th), 0.55); };
  const parts: THREE.BufferGeometry[] = [];
  const ribbon = (u0: number, u1: number, lo: (v: number) => number, hi: (v: number) => number, n = 16, rows = 4, off = 0.0022) => {
    const P: number[] = [], I: number[] = [];
    for (let i = 0; i <= n; i++) for (let r = 0; r <= rows; r++) { const v = i / n, u = lerp(u0, u1, v), x = (u - 0.5) * SHOE.L, y = lerp(lo(v), hi(v), r / rows); P.push(x, y + spring(x), zOut(u, y) + off); }
    for (let i = 0; i < n; i++) for (let r = 0; r < rows; r++) { const a = i * (rows + 1) + r, b = a + rows + 1; I.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals(); return g.toNonIndexed(); };
  // the band: from low at the heel, rising toward the laces (original shape)
  parts.push(ribbon(0.12, 0.62, (v) => y0 + 0.01 + v * 0.03, (v) => y0 + 0.026 + v * 0.032, 18, 4));
  parts.push(ribbon(0.015, 0.06, () => y0 + 0.006, () => y0 + 0.058, 4, 4));   // heel tab
  for (let i = 0; i < 4; i++) { const u = 0.4 + i * 0.085, x = (u - 0.5) * SHOE.L, y = y0 + profU(u) + spring(x) + 0.0015, b = new THREE.BoxGeometry(0.008, 0.004, 0.042 - i * 0.004); b.rotateZ(-0.25 - i * 0.05); b.translate(x, y, 0); parts.push(b.toNonIndexed()); }
  for (const g of parts) for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal") g.deleteAttribute(k);
  const trim = mergeGeometries(parts, false)!; trim.computeVertexNormals();
  for (const k of Object.keys(sole.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") sole.deleteAttribute(k);
  SNEAKER = { upper: up, sole, trim };
  return SNEAKER;
};
/** the collar opening: a dark ellipse lying on the top of the heel */
export const collarY = () => 0.022 + profU(0.24) + 0.001;
export const SHOE_COLS = ["#c8352e", "#2a5a9a", "#2f8a5a", "#e8a22e", "#3a3a44", "#8a3a8a", "#e86a2a", "#2a8a9a", "#d8d0c4", "#5a6a2a", "#b8235a", "#4a4ad0"];
const canvasMat = new Map<string, THREE.MeshStandardMaterial>();
const sm = (key: string, c: string, rough = 0.7) => { if (!canvasMat.has(key)) canvasMat.set(key, new THREE.MeshStandardMaterial({ color: c, roughness: rough, envMapIntensity: 0.8 })); return canvasMat.get(key)!; };
const smV = (key: string, c: string, rough = 0.7) => { const m = sm(key + "V", c, rough); m.vertexColors = true; return m; };
/** one sneaker as a group (y = 0 on the sole bottom). left = mirrored. */
export const sneaker = (colr: string, left = false, trim = "#f4f2ec") => {
  const g = sneakerGeo(), G = new THREE.Group();
  const u = new THREE.Mesh(g.upper, smV("up" + colr, colr, 0.75)), s = new THREE.Mesh(g.sole, sm("sole", "#f0ece2", 0.6)), t = new THREE.Mesh(g.trim, sm("trim" + trim, trim, 0.6));
  const col2 = new THREE.Mesh(new THREE.CircleGeometry(1, 20), sm("collar", "#1c1a20", 0.9)); col2.rotation.x = -Math.PI / 2; col2.scale.set(0.052, 0.03, 1); col2.position.set(-SHOE.L / 2 + 0.07, collarY(), 0);
  for (const m of [u, s, t]) { m.castShadow = true; m.receiveShadow = true; G.add(m); } void col2;
  if (left) G.scale.z = -1;
  return G;
};
/** many sneakers at once: three InstancedMeshes (upper / sole / trim) + collar; set(i, matrix, visible) */
export class ShoeField {
  upper: THREE.InstancedMesh; sole: THREE.InstancedMesh; trim: THREE.InstancedMesh; collar: THREE.InstancedMesh; n: number;
  private M = new THREE.Matrix4(); private Z = new THREE.Matrix4().makeScale(0, 0, 0); private C = new THREE.Matrix4();
  constructor(root: THREE.Object3D, n: number, colors: (i: number) => string) {
    const g = sneakerGeo(); this.n = n;
    this.upper = new THREE.InstancedMesh(g.upper, new THREE.MeshStandardMaterial({ roughness: 0.72, envMapIntensity: 0.8, vertexColors: true }), n);
    this.sole = new THREE.InstancedMesh(g.sole, sm("sole", "#f0ece2", 0.6), n);
    this.trim = new THREE.InstancedMesh(g.trim, sm("trim#f4f2ec", "#f4f2ec", 0.6), n);
    const cg = new THREE.CircleGeometry(1, 16); cg.rotateX(-Math.PI / 2); cg.scale(0.052, 1, 0.03); cg.translate(-SHOE.L / 2 + 0.07, collarY(), 0);
    this.collar = new THREE.InstancedMesh(cg, sm("collar", "#1c1a20", 0.9), n);
    const Cc = new THREE.Color();
    for (let i = 0; i < n; i++) { Cc.set(colors(i)); this.upper.setColorAt(i, Cc); }
    this.C.makeTranslation(0, 0, 0);
    for (const m of [this.upper, this.sole, this.trim]) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; root.add(m); }
  }
  set(i: number, pos: V3, yaw: number, pitch = 0, roll = 0, left = false, s = 1) {
    this.M.compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(roll, yaw, pitch, "YXZ")), new THREE.Vector3(s, s, left ? -s : s));
    for (const m of [this.upper, this.sole, this.trim, this.collar]) m.setMatrixAt(i, this.M);
  }
  hide(i: number) { for (const m of [this.upper, this.sole, this.trim, this.collar]) m.setMatrixAt(i, this.Z); }
  done() { for (const m of [this.upper, this.sole, this.trim, this.collar]) m.instanceMatrix.needsUpdate = true; }
}

// ---------------- shoe boxes ----------------
const boxLabel = (k: number) => ctex("shBoxLab" + (k % 6), 256, 96, (g) => { g.fillStyle = "#f4f2ea"; g.fillRect(0, 0, 256, 96); g.fillStyle = "#2a2230"; g.font = "900 30px Arial"; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(["SIZE 41", "SIZE 42", "SIZE 40", "SIZE 43", "SIZE 39", "SIZE 44"][k % 6], 14, 34); g.font = "700 22px Arial"; g.fillText("1 PAIR", 14, 70); for (let i = 0; i < 18; i++) g.fillRect(160 + i * 5, 52, i % 3 ? 2 : 3, 34); });
export const BOX = { w: 0.34, h: 0.13, d: 0.21 };
export const shoeBox = (k: number, open = 0) => {
  const G = new THREE.Group(), c = ["#e8622c", "#2a5a9a", "#d8c8a8", "#3a3a44", "#c8352e", "#f2c230"][k % 6];
  const body = new THREE.Mesh(boxM(BOX.w, BOX.h - 0.02, BOX.d), phMat("painted_plaster_wall", 3, 3, { tint: c, rough: 0.85, env: 0.6, key: "box" + c }));
  body.position.y = (BOX.h - 0.02) / 2; G.add(body);
  const lid = new THREE.Group(); const lm = new THREE.Mesh(boxM(BOX.w + 0.012, 0.035, BOX.d + 0.012), phMat("painted_plaster_wall", 3, 3, { tint: c, rough: 0.8, env: 0.6, key: "lid" + c })); lm.position.set(0, 0.0175, BOX.d / 2 + 0.006); lid.add(lm);
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.045), new THREE.MeshStandardMaterial({ map: boxLabel(k), roughness: 0.9 })); lab.position.set(0.09, (BOX.h - 0.02) / 2, BOX.d / 2 + 0.002); G.add(lab);
  lid.position.set(0, BOX.h - 0.035, -BOX.d / 2 - 0.006); lid.rotation.x = -open * 1.9; G.add(lid);
  G.traverse((m) => { (m as THREE.Mesh).castShadow = (m as THREE.Mesh).receiveShadow = true; });
  G.userData.lid = lid;
  return G;
};
/** big cardboard moving box (the three loot boxes), open top flaps */
export const lootBox = (k: number) => {
  const G = new THREE.Group(), m = phMat("painted_plaster_wall", 1.2, 1.2, { tint: "#c89a64", rough: 0.92, env: 0.45, key: "loot" }), W = 0.7, H = 0.55, D = 0.5, t = 0.012;
  for (const [w, h, d, x, y, z] of [[W, t, D, 0, t / 2, 0], [W, H, t, 0, H / 2, -D / 2], [W, H, t, 0, H / 2, D / 2], [t, H, D, -W / 2, H / 2, 0], [t, H, D, W / 2, H / 2, 0]] as [number, number, number, number, number, number][]) { const b = new THREE.Mesh(boxM(w, h, d), m); b.position.set(x, y, z); G.add(b); }
  for (const [s, ax] of [[1, "z"], [-1, "z"]] as [number, string][]) { const f = new THREE.Mesh(boxM(W, t, D * 0.5), m); f.geometry.translate(0, 0, D * 0.25); f.position.set(0, H, s * D / 2); f.rotation.x = s * (Math.PI - 0.5); void ax; G.add(f); }
  const tape = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.8, 0.06), sm("tape", "#b89a6a", 0.4)); tape.position.set(0, H * 0.6, D / 2 + 0.008); G.add(tape);
  const nm = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.12), new THREE.MeshStandardMaterial({ map: ctex("lootNo" + k, 256, 100, (g) => { g.clearRect(0, 0, 256, 100); g.fillStyle = "#1a1a22"; g.font = "900 70px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(k + 1), 128, 54); }), transparent: true, alphaTest: 0.3, roughness: 0.9 }));
  nm.position.set(-0.18, H * 0.6, D / 2 + 0.009); G.add(nm);
  G.traverse((o) => { (o as THREE.Mesh).castShadow = (o as THREE.Mesh).receiveShadow = true; });
  return G;
};

// ---------------- the cargo tricycle (front box between two wheels, one rear wheel) ----------------
export const bikeWheel = (r: number, n = 18) => {
  const G = new THREE.Group(), steel = col("#b8bcc4", 0.3, 0.9, 1.2), rub = col("#1e1c20", 0.8);
  const t = new THREE.Mesh(new THREE.TorusGeometry(r - 0.022, 0.024, 10, 48), rub); G.add(t);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r - 0.05, 0.01, 6, 48), steel); G.add(rim);
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, s = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, r - 0.06, 4), steel); s.position.set(Math.cos(a) * (r - 0.06) / 2, Math.sin(a) * (r - 0.06) / 2, ((i % 2) - 0.5) * 0.02); s.rotation.z = a - Math.PI / 2; G.add(s); }
  const hub = new THREE.Mesh(cylM(0.03, 0.03, 0.08, 16), steel); hub.rotation.x = Math.PI / 2; G.add(hub);
  G.traverse((o) => { (o as THREE.Mesh).castShadow = true; });
  return G;   // wheel plane = XY, axle along z
};
export const tricycle = () => {
  const G = new THREE.Group(), frame = col("#2a6a8a", 0.45, 0.5, 1.1), wd = phMat("brown_planks_05", 1 / 0.8, 1 / 0.8, { tint: "#a87a50", rough: 1, env: 0.6, key: "trikebox" });
  const wheels: THREE.Group[] = [];
  for (const z of [-0.36, 0.36]) { const w = bikeWheel(0.3); w.position.set(0.55, 0.3, z); G.add(w); wheels.push(w); }
  const rw = bikeWheel(0.33); rw.position.set(-0.75, 0.33, 0); G.add(rw); wheels.push(rw);
  const tube = (a: V3, b: V3, r = 0.022) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B); const m = new THREE.Mesh(cylM(r, r, L, 10), frame); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); m.castShadow = true; G.add(m); };
  tube([0.55, 0.3, -0.38], [0.55, 0.3, 0.38], 0.018); tube([0.55, 0.32, 0], [0.05, 0.42, 0]); tube([0.05, 0.42, 0], [-0.75, 0.33, 0]); tube([0.05, 0.42, 0], [-0.25, 0.95, 0]); tube([-0.25, 0.95, 0], [-0.75, 0.33, 0]);
  tube([0.12, 0.62, 0], [0.12, 1.05, 0]); tube([0.12, 1.05, -0.26], [0.12, 1.05, 0.26], 0.016);
  const seat = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 10), col("#1e1c20", 0.7)); seat.scale.set(1.3, 0.35, 0.8); seat.position.set(-0.27, 0.99, 0); G.add(seat);
  // cargo box over the front axle
  const B = new THREE.Group(); B.position.set(0.55, 0.55, 0); G.add(B);
  for (const [w, h, d, x, y, z] of [[0.75, 0.03, 0.82, 0, 0, 0], [0.75, 0.42, 0.025, 0, 0.21, -0.41], [0.75, 0.42, 0.025, 0, 0.21, 0.41], [0.025, 0.42, 0.82, -0.375, 0.21, 0], [0.025, 0.42, 0.82, 0.375, 0.21, 0]] as [number, number, number, number, number, number][]) { const b = new THREE.Mesh(boxM(w, h, d), wd); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; B.add(b); }
  G.userData = { wheels, cargo: B };
  return G;
};

// ---------------- the roll-up shutter + padlock ----------------
const shutterTex = () => { const t = phMat("painted_metal_shutter", 1 / 1.2, 1 / 1.2, { tint: "#a8b0b8", rough: 0.55, metal: 0.4, env: 1.0, key: "shutter" }); return t; };
export const shutter = (w: number, h: number, withLock = true, lockAt: [number, number] = [0, 0.075]) => {
  const G = new THREE.Group();
  const curtain = new THREE.Mesh(boxM(w, 1, 0.03), shutterTex()); curtain.geometry.translate(0, -0.5, 0); curtain.castShadow = curtain.receiveShadow = true; G.add(curtain);
  const ribs = new THREE.Group(); G.add(ribs);
  const rib = col("#8a9098", 0.4, 0.6);
  for (let i = 0; i < 40; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.012, 0.012), rib); r.position.set(0, -i * 0.075, 0.02); ribs.add(r); }
  const bar = new THREE.Mesh(boxM(w, 0.06, 0.06), col("#5a6068", 0.4, 0.6)); G.add(bar);
  const drum = new THREE.Mesh(boxM(w + 0.2, 0.38, 0.36), shutterTex()); drum.position.set(0, 0.19, -0.05); drum.castShadow = true; G.add(drum);
  // padlock on the bottom bar's hasp
  const lock = new THREE.Group(); G.add(lock);
  const body = new THREE.Mesh(boxM(0.075, 0.065, 0.03), col("#c49a48", 0.3, 0.9, 1.4)); body.position.y = -0.035; lock.add(body);
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.006, 8, 20, Math.PI), col("#b8bcc4", 0.25, 0.95, 1.4)); shackle.position.y = 0.0; lock.add(shackle);
  const hasp = new THREE.Mesh(boxM(0.04, 0.08, 0.02), col("#5a6068", 0.4, 0.7)); hasp.position.set(0, 0.0, -0.025); G.add(hasp);
  /** u: 0 closed .. 1 fully rolled up; snap 0 locked / 1 snapped; fallT 0..1 the snapped lock drops to the pavement */
  const set = (u: number, snap = 0, fallT = 0) => {
    const down = h * (1 - cl(u)); curtain.scale.y = Math.max(0.001, down); ribs.children.forEach((r, i) => { r.visible = i * 0.075 < down - 0.02; });
    bar.position.y = -down; hasp.position.set(lockAt[0], -h + lockAt[1] - 0.02, -0.035); hasp.visible = withLock;
    lock.visible = withLock && (snap < 0.5 || fallT < 1);
    const lx = lockAt[0], ly = -h + lockAt[1], drop = lockAt[1] - 0.05;
    if (snap > 0.5) { const t = cl(fallT), dy = t < 0.6 ? (t / 0.6) ** 2 * drop : drop - Math.sin(((t - 0.6) / 0.4) * Math.PI) * Math.min(0.08, drop * 0.2);
      lock.position.set(lx + 0.06 * t, ly - dy, -0.07 - 0.22 * t); lock.rotation.set(0, 0, t * 2.4); shackle.rotation.z = 0.5; shackle.position.y = 0.012; }
    else { lock.position.set(lx, ly, -0.07); lock.rotation.set(0, 0, 0); shackle.rotation.z = 0; shackle.position.y = 0; }
  };
  set(0);
  return { G, set };
};

// ---------------- signs, clock, glove ----------------
export const clockTex = (hh: number, mm: number) => ctex("shClock" + hh + "_" + mm, 512, 512, (g) => {
  g.fillStyle = "#f4f0e4"; g.beginPath(); g.arc(256, 256, 250, 0, TAU); g.fill(); g.strokeStyle = "#1e1c22"; g.lineWidth = 18; g.beginPath(); g.arc(256, 256, 238, 0, TAU); g.stroke();
  g.fillStyle = "#1e1c22"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 58px Georgia";
  for (let i = 1; i <= 12; i++) { const a = (i / 12) * TAU; g.fillText(String(i), 256 + Math.sin(a) * 182, 256 - Math.cos(a) * 182); }
  const hand = (a: number, L: number, w: number) => { g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.moveTo(256, 256); g.lineTo(256 + Math.sin(a) * L, 256 - Math.cos(a) * L); g.stroke(); };
  hand(((hh % 12) + mm / 60) / 12 * TAU, 120, 18); hand((mm / 60) * TAU, 180, 11); g.beginPath(); g.arc(256, 256, 16, 0, TAU); g.fill();
});
export const glove = () => {
  // a leather work glove: hand silhouette extruded with a bevel (fingers together, thumb out)
  // 2026-11-24: rounded finger tips and thumb (the pointed polygon read as a crown / a chocolate bar in the insert)
  const s = new THREE.Shape();
  s.moveTo(-0.045, -0.11); s.lineTo(0.045, -0.11); s.lineTo(0.05, -0.02);
  s.quadraticCurveTo(0.074, -0.006, 0.086, 0.02); s.quadraticCurveTo(0.094, 0.042, 0.077, 0.043); s.quadraticCurveTo(0.062, 0.037, 0.047, 0.022);
  const finger = (xr: number, xl: number, tip: number, notch: number) => { const r = (xr - xl) / 2, cx = (xr + xl) / 2;
    s.lineTo(xr, tip - r); s.quadraticCurveTo(xr, tip, cx, tip); s.quadraticCurveTo(xl, tip, xl, tip - r); s.lineTo(xl - 0.0004, notch); };
  finger(0.0465, 0.0245, 0.097, 0.079); finger(0.0241, 0.0025, 0.11, 0.086); finger(0.0021, -0.0205, 0.103, 0.081); finger(-0.0209, -0.046, 0.087, 0.06);
  s.lineTo(-0.048, 0.0); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.014, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 3, curveSegments: 8 });
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, phMat("fabric_pattern_05", 70, 70, { tint: "#d8a452", rough: 0.85, env: 0.8, nor: 0.5, key: "glove3" })); m.castShadow = true; m.receiveShadow = true;
  const cuff = new THREE.Mesh(boxM(0.1, 0.035, 0.03), col("#7a4426", 0.7)); cuff.position.set(0, -0.11, 0.007); m.add(cuff);
  return m;
};
export const shopSign = (key: string, title: string, sub: string, bg: string, fg: string) => ctex("shSign" + key, 1024, 300, (g, r) => {
  g.fillStyle = bg; g.fillRect(0, 0, 1024, 300); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,255,255"},${0.03 + r() * 0.05})`; g.fillRect(r() * 1024, r() * 300, 2 + r() * 40, 1 + r() * 4); }
  g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(12, 12, 1000, 276);
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, title, 512, 120, 900, 150, SERIF); g.font = "700 54px Arial"; fitText(g, sub, 512, 232, 760, 54, "700 %spx Arial");
});
export { hsh };
