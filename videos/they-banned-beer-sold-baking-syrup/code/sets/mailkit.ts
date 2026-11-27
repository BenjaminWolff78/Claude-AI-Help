// Kit for "Why One Banker Mailed Himself an Entire Bank" (2026-11-23, master prompt v26): real Poly Haven photo
// textures on bevel-free but real-proportion code geometry (counters, planks, wheels, parcels), merged per material
// so the software renderer draws few calls. Everything here is ORIGINAL.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ctex } from "../paint";
import { phMat, boxM, planeM, phTexture, type PhTex } from "../ph";
import { fitText } from "./portkit_common";
import type { V3 } from "./types";

export const TAU = Math.PI * 2;
export const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const sm = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const hsh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
export const SERIF = "900 %spx Georgia, 'Times New Roman', serif";
export const SLAB = "900 %spx 'Rockwell', 'Courier New', Georgia, serif";

/** static geometry merged per material (position / normal / uv only) */
export class MB {
  private m = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(g: THREE.BufferGeometry, mat: THREE.Material, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], scl: V3 = [1, 1, 1]) {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], "YXZ"));
    const M = new THREE.Matrix4().compose(new THREE.Vector3(...pos), q, new THREE.Vector3(...scl));
    let geo = g.index ? g.toNonIndexed() : g.clone();
    for (const k of Object.keys(geo.attributes)) if (!["position", "normal", "uv"].includes(k)) geo.deleteAttribute(k);
    if (!geo.attributes.uv) geo.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array((geo.attributes.position.count) * 2), 2));
    geo.applyMatrix4(M);
    if (!this.m.has(mat)) this.m.set(mat, []);
    this.m.get(mat)!.push(geo);
    return this;
  }
  box(w: number, h: number, d: number, mat: THREE.Material, pos: V3, rot: V3 = [0, 0, 0]) { return this.add(boxM(w, h, d), mat, pos, rot); }
  /** a box given by its min corner (x0,y0,z0) and max corner */
  span(a: V3, b: V3, mat: THREE.Material) { return this.box(b[0] - a[0], b[1] - a[1], b[2] - a[2], mat, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]); }
  flush(root: THREE.Object3D, o: { cast?: boolean; name?: string } = {}) {
    for (const [mat, list] of this.m) {
      const g = mergeGeometries(list, false); if (!g) continue;
      const me = new THREE.Mesh(g, mat); me.castShadow = o.cast !== false; me.receiveShadow = true; me.name = o.name ?? "mb"; root.add(me);
    }
    this.m.clear();
  }
}

/** a cylinder with metre UVs around and along */
export const cylM = (r0: number, r1: number, h: number, n = 24, open = false) => {
  const g = new THREE.CylinderGeometry(r0, r1, h, n, 1, open);
  const uv = g.attributes.uv as THREE.BufferAttribute, c = Math.PI * (r0 + r1);
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * c, uv.getY(i) * h);
  return g;
};

/** painted sign / label textures (canvas: signs, labels, posters and screens only, v26 6.4d) */
export const signTex = (key: string, lines: string[], o: { w?: number; h?: number; bg?: string; fg?: string; edge?: string; font?: string; worn?: boolean; sub?: number } = {}) => {
  const w = o.w ?? 1024, h = o.h ?? 256;
  return ctex("mbSign" + key, w, h, (g, r) => {
    g.fillStyle = o.bg ?? "#2a3a2e"; g.fillRect(0, 0, w, h);
    if (o.worn !== false) { for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,255,255"},${0.03 + r() * 0.05})`; g.fillRect(r() * w, r() * h, 2 + r() * 30, 1 + r() * 4); } }
    if (o.edge) { g.strokeStyle = o.edge; g.lineWidth = Math.max(6, h * 0.04); g.strokeRect(h * 0.05, h * 0.05, w - h * 0.1, h - h * 0.1); }
    g.fillStyle = o.fg ?? "#f2e2b0"; g.textAlign = "center"; g.textBaseline = "middle";
    const n = lines.length, sub = o.sub ?? 1;
    lines.forEach((l, i) => { const big = i === 0 ? 1 : sub; fitText(g, l, w / 2, (h * (i + 0.5)) / n + 2, w * 0.86, (h / n) * 0.62 * big, o.font ?? SERIF); });
  });
};
/** an unlit-looking but sun-lit sign board (canvas face + wood edge) */
export const signBoard = (mb: MB, root: THREE.Object3D, tex: THREE.Texture, w: number, h: number, pos: V3, yaw = 0, edge = 0.05) => {
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
  face.position.set(pos[0] + Math.sin(yaw) * 0.026, pos[1], pos[2] + Math.cos(yaw) * 0.026); face.rotation.y = yaw; face.receiveShadow = true; root.add(face);
  mb.box(w + edge * 2, h + edge * 2, 0.05, wood("brown_planks_05", "#6a4a32"), pos, [0, yaw, 0]);
  return face;
};

/** shortcuts for the photo materials, tiled at real size (rx = 1 / tile metres) */
export const wood = (t: PhTex, tint = "#ffffff", tile = 1.2) => phMat(t, 1 / tile, 1 / tile, { tint, rough: 1, env: 0.7 });
export const mat = (t: PhTex, tile: number, tint = "#ffffff", o: { rough?: number; env?: number; nor?: number; metal?: number } = {}) => phMat(t, 1 / tile, 1 / tile, { tint, rough: o.rough ?? 1, env: o.env ?? 0.8, nor: o.nor, metal: o.metal });
const solid = new Map<string, THREE.MeshStandardMaterial>();
export const col = (c: string, rough = 0.7, metal = 0, env = 1) => { const k = c + rough + metal + env; if (!solid.has(k)) solid.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: metal, envMapIntensity: env })); return solid.get(k)!; };
export const brass = () => col("#c49a48", 0.32, 0.9, 1.4);
export const iron = () => col("#2c2a2e", 0.45, 0.75, 1.0);
export const glass = () => { const k = "glass"; if (!solid.has(k)) { const m = new THREE.MeshStandardMaterial({ color: "#b8d4e0", roughness: 0.06, metalness: 0.0, transparent: true, opacity: 0.16, envMapIntensity: 1.8, depthWrite: false }); solid.set(k, m); } return solid.get(k)!; };

/** a run of planks (deck, wall boards, crate sides): n planks along `along` axis ('x' or 'z'), each with a tiny height
 *  jitter, a gap and its own tint so the boards read as separate boards */
export const planks = (mb: MB, a: V3, b: V3, along: "x" | "z", n: number, t: PhTex, tints: string[], gap = 0.012) => {
  const L = along === "x" ? b[0] - a[0] : b[2] - a[2], w = L / n;
  for (let i = 0; i < n; i++) {
    const tint = tints[Math.floor(hsh(i, a[0] + a[2]) * tints.length)], dy = (hsh(i, 3.1 + a[0]) - 0.5) * 0.008;
    const m = phMat(t, 1 / 1.4, 1 / 1.4, { tint, rough: 1, env: 0.6, key: "pl" + tint });
    if (along === "x") mb.span([a[0] + i * w + gap / 2, a[1] + dy, a[2]], [a[0] + (i + 1) * w - gap / 2, b[1] + dy, b[2]], m);
    else mb.span([a[0], a[1] + dy, a[2] + i * w + gap / 2], [b[0], b[1] + dy, a[2] + (i + 1) * w - gap / 2], m);
  }
};

/** a spoked cart wheel (iron tyre, felloe, n spokes, hub) in the YZ plane (axle along x), radius r */
export const wheel = (r: number, n = 12) => {
  const g = new THREE.Group();
  const w = wood("brown_planks_05", "#8a6440", 0.8), tyre = iron();
  const t = new THREE.Mesh(new THREE.TorusGeometry(r - 0.025, 0.028, 8, 40), tyre); t.rotation.y = Math.PI / 2; g.add(t);
  const fel = new THREE.Mesh(new THREE.TorusGeometry(r - 0.07, 0.045, 8, 36), w); fel.rotation.y = Math.PI / 2; g.add(fel);
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, s = new THREE.Mesh(cylM(0.018, 0.024, r - 0.1, 8), w); s.position.set(0, Math.cos(a) * (r - 0.1) / 2, Math.sin(a) * (r - 0.1) / 2); s.rotation.x = a; g.add(s); }
  const hub = new THREE.Mesh(cylM(0.09, 0.11, 0.26, 24), w); hub.rotation.z = Math.PI / 2; g.add(hub);
  const cap = new THREE.Mesh(cylM(0.05, 0.05, 0.3, 16), tyre); cap.rotation.z = Math.PI / 2; g.add(cap);
  g.traverse((m) => { (m as THREE.Mesh).castShadow = (m as THREE.Mesh).receiveShadow = true; });
  return g;
};

// ---------------- parcels: the story object ----------------
/** label texture of one parcel: who it goes to, PARCEL POST, a stamp (7¢) and a postmark */
export const labelTex = (to: string, i = 0) => ctex("mbLabel" + to + i, 256, 160, (g, r) => {
  g.fillStyle = "#efe4c6"; g.fillRect(0, 0, 256, 160);
  for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(120,90,50,${0.04 + r() * 0.05})`; g.fillRect(r() * 256, r() * 160, 3 + r() * 40, 1 + r() * 3); }
  g.strokeStyle = "#7a5a3a"; g.lineWidth = 4; g.strokeRect(5, 5, 246, 150);
  g.fillStyle = "#2a2230"; g.textAlign = "left"; g.textBaseline = "middle"; g.font = "700 20px Georgia"; g.fillText("PARCEL POST", 16, 26);
  fitText(g, to, 104, 92, 180, 42, "900 %spx Georgia, serif");
  // stamp (perforated), 7¢
  g.fillStyle = "#b8352e"; g.fillRect(196, 14, 46, 52); g.fillStyle = "#efe4c6"; for (let k = 0; k < 8; k++) { g.beginPath(); g.arc(196 + k * 6.5, 14, 2.4, 0, TAU); g.arc(196 + k * 6.5, 66, 2.4, 0, TAU); g.fill(); }
  g.fillStyle = "#f6e8d0"; g.textAlign = "center"; g.font = "900 26px Georgia"; g.fillText("7¢", 219, 42);
  g.strokeStyle = "rgba(40,30,60,0.55)"; g.lineWidth = 2.5; g.beginPath(); g.arc(180, 120, 22, 0, TAU); g.stroke(); for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(140, 112 + k * 6); g.lineTo(240, 112 + k * 6); g.stroke(); }
});
export const NEIGHBOURS = ["MRS. PIKE", "OLD GUS", "THE BARBER", "MISS DELL", "THE SMITH", "DR. HALE", "MR. ORR", "MRS. TATE", "THE BAKER", "MR. COBB", "MISS LUND", "THE WIDOW ROSS"];
/** one parcel box (0.46 x 0.28 x 0.32 m): plank box with a twine cross and a paper label on the top and front */
export const PARCEL = { w: 0.46, h: 0.28, d: 0.32 };
const parcelGeo = { g: null as THREE.BufferGeometry | null };
export const parcelMesh = (to: string, i = 0) => {
  const G = new THREE.Group();
  const body = new THREE.Mesh(boxM(PARCEL.w, PARCEL.h, PARCEL.d), wood("brown_planks_05", ["#c89a6a", "#b48a5c", "#d2a878"][i % 3], 0.6));
  body.position.y = PARCEL.h / 2; body.castShadow = body.receiveShadow = true; G.add(body);
  const tw = col("#d8c49a", 0.9);
  const s1 = new THREE.Mesh(new THREE.BoxGeometry(PARCEL.w + 0.006, PARCEL.h + 0.006, 0.012), tw); s1.position.y = PARCEL.h / 2; G.add(s1);
  const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.012, PARCEL.h + 0.006, PARCEL.d + 0.006), tw); s2.position.y = PARCEL.h / 2; G.add(s2);
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.125), new THREE.MeshStandardMaterial({ map: labelTex(to, i), roughness: 0.9 }));
  lab.rotation.x = -Math.PI / 2; lab.position.set(-0.11, PARCEL.h + 0.004, 0.06); G.add(lab);
  const lab2 = lab.clone(); lab2.rotation.set(0, 0, 0); lab2.position.set(-0.1, PARCEL.h * 0.52, PARCEL.d / 2 + 0.004); G.add(lab2);
  void parcelGeo;
  return G;
};
/** many parcels at once (the hill of boxes): an InstancedMesh body + twine; returns a setter for how many show */
export const parcelPile = (root: THREE.Object3D, spots: { p: V3; yaw: number }[]) => {
  const n = spots.length;
  const bodyM = wood("brown_planks_05", "#c89a6a", 0.6);
  const body = new THREE.InstancedMesh(boxM(PARCEL.w, PARCEL.h, PARCEL.d), bodyM, n);
  const tw = new THREE.InstancedMesh(new THREE.BoxGeometry(PARCEL.w + 0.006, 0.012, 0.012), col("#d8c49a", 0.9), n * 2);
  const lab = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.2, 0.125), new THREE.MeshStandardMaterial({ map: labelTex("A NEIGHBOR", 9), roughness: 0.9 }), n);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), C = new THREE.Color();
  spots.forEach((s, i) => {
    q.setFromEuler(e.set(0, s.yaw, 0)); M.compose(new THREE.Vector3(s.p[0], s.p[1] + PARCEL.h / 2, s.p[2]), q, one); body.setMatrixAt(i, M);
    C.set(["#d2a676", "#b8885a", "#c89a6a", "#dcb486", "#a87c52"][Math.floor(hsh(i, 2) * 5)]); body.setColorAt(i, C);
    const top = new THREE.Vector3(s.p[0], s.p[1] + PARCEL.h + 0.004, s.p[2]);
    M.compose(top, q, one); tw.setMatrixAt(i * 2, M);
    q.setFromEuler(e.set(0, s.yaw + Math.PI / 2, 0)); M.compose(top, q, new THREE.Vector3(PARCEL.d / PARCEL.w, 1, 1)); tw.setMatrixAt(i * 2 + 1, M);
    q.setFromEuler(e.set(-Math.PI / 2, 0, s.yaw)); const lp = new THREE.Vector3(-0.11, 0, 0.06).applyAxisAngle(new THREE.Vector3(0, 1, 0), s.yaw); M.compose(top.clone().add(lp).setY(top.y + 0.002), q, one); lab.setMatrixAt(i, M);
  });
  for (const m of [body, tw, lab]) { m.castShadow = m.receiveShadow = true; m.frustumCulled = false; root.add(m); }
  return (k: number) => { const c = Math.max(0, Math.min(n, Math.round(k))); body.count = c; tw.count = c * 2; lab.count = c; body.visible = tw.visible = lab.visible = c > 0; };
};

/** a code pine: bark trunk + 6-8 drooping tiers of needle clusters (cutout cards, alphaTest), lit and shaded sides */
const needleTex = () => ctex("mbNeedles", 256, 256, (g, r) => {
  g.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 420; i++) {
    const a = r() * TAU, d = Math.pow(r(), 0.6) * 118, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d * 0.72;
    const len = 10 + r() * 22, ang = a + (r() - 0.5) * 0.9, v = Math.round(40 + r() * 50);
    g.strokeStyle = `rgb(${v * 0.55},${v + 30},${v * 0.6})`; g.lineWidth = 2.2 + r() * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); g.stroke();
  }
});
export const pine = (h: number, seed = 0) => {
  const G = new THREE.Group();
  const bark = mat("rough_wood", 0.8, "#6a5040");
  const tr = new THREE.Mesh(cylM(h * 0.012, h * 0.03, h * 0.9, 10), bark); tr.position.y = h * 0.45; tr.castShadow = true; G.add(tr);
  const nm = new THREE.MeshStandardMaterial({ map: needleTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.95, color: new THREE.Color(0.62, 0.78, 0.6) });
  const tiers = 7;
  for (let t = 0; t < tiers; t++) {
    const u = t / (tiers - 1), y = h * (0.22 + 0.74 * u), R = h * (0.26 * (1 - u) + 0.05);
    const k = 5 + Math.round((1 - u) * 3);
    for (let i = 0; i < k; i++) {
      const a = (i / k) * TAU + hsh(t * 9 + i, seed) * 0.7, s = R * (0.9 + 0.4 * hsh(i, t + seed));
      const card = new THREE.Mesh(new THREE.PlaneGeometry(s * 1.5, s * 1.05), nm);
      card.position.set(Math.cos(a) * R * 0.45, y - s * 0.12, Math.sin(a) * R * 0.45); card.rotation.set(-0.5 - 0.3 * u, -a + Math.PI / 2, 0, "YXZ");
      card.castShadow = true; card.receiveShadow = true; G.add(card);
    }
    const flat = new THREE.Mesh(new THREE.PlaneGeometry(R * 2.1, R * 2.1), nm); flat.rotation.x = -Math.PI / 2; flat.rotation.z = hsh(t, seed) * 3; flat.position.y = y - R * 0.05; flat.castShadow = true; G.add(flat);
  }
  return G;
};
/** far pines as one InstancedMesh of cones (dark needle green, lit by the sun) */
export const farPines = (root: THREE.Object3D, spots: V3[], hmin = 7, hmax = 16) => {
  // a pine silhouette: trunk + 5 drooping, jagged tiers (merged), dark blue-green, lit by the sun
  const parts: THREE.BufferGeometry[] = [];
  const tr = new THREE.CylinderGeometry(0.03, 0.05, 0.35, 6); tr.translate(0, 0.17, 0); parts.push(tr.toNonIndexed());
  for (let t = 0; t < 5; t++) { const u = t / 4, r = 0.36 * (1 - u) + 0.08, y0 = 0.15 + u * 0.68; const c = new THREE.ConeGeometry(r, 0.34 - u * 0.08, 9, 1, true); c.translate(0, y0 + 0.15, 0);
    const p = c.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) { if (p.getY(i) < y0 + 0.05) { const a = Math.atan2(p.getZ(i), p.getX(i)); const j = 1 + 0.18 * Math.sin(a * 5 + t * 1.7); p.setX(i, p.getX(i) * j); p.setZ(i, p.getZ(i) * j); p.setY(i, p.getY(i) - 0.03 * (1 + Math.sin(a * 3 + t))); } }
    parts.push(c.toNonIndexed()); }
  for (const g of parts) for (const k of Object.keys(g.attributes)) if (k !== "position") g.deleteAttribute(k);
  const g = mergeGeometries(parts, false)!; g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ color: "#41604a", roughness: 0.95, envMapIntensity: 0.5, side: THREE.DoubleSide });
  const im = new THREE.InstancedMesh(g, m, spots.length);
  const M = new THREE.Matrix4(), C = new THREE.Color(), q = new THREE.Quaternion();
  spots.forEach((p, i) => { const h = lerp(hmin, hmax, hsh(i, 5.5)); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), hsh(i, 6) * 6); M.compose(new THREE.Vector3(...p), q, new THREE.Vector3(h * 0.9, h, h * 0.9)); im.setMatrixAt(i, M); C.setHSL(0.36 + (hsh(i, 7) - 0.5) * 0.06, 0.22, 0.24 + hsh(i, 8) * 0.1); im.setColorAt(i, C); });
  im.castShadow = true; im.receiveShadow = true; root.add(im); return im;
};
/** small lit pebbles near the lens (individual stones with their own shadows) */
export const pebbles = (root: THREE.Object3D, n: number, x0: number, x1: number, z0: number, z1: number, y: number | ((x: number, z: number) => number), seed = 1, smin = 0.03, smax = 0.11) => {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const m = phMat("rock_face", 2, 2, { tint: "#d8c8b0", rough: 1, env: 0.6 });
  const im = new THREE.InstancedMesh(g, m, n);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), C = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, hsh(i, seed)), z = lerp(z0, z1, hsh(i, seed + 1.7)), s = lerp(smin, smax, Math.pow(hsh(i, seed + 2.3), 2.5));
    const yy = typeof y === "number" ? y : y(x, z);
    q.setFromEuler(e.set(hsh(i, 4) * 3, hsh(i, 5) * 3, hsh(i, 6) * 3));
    M.compose(new THREE.Vector3(x, yy + s * 0.25, z), q, new THREE.Vector3(s, s * 0.55, s * 0.85)); im.setMatrixAt(i, M);
    C.setHSL(0.08, 0.12, 0.45 + hsh(i, 9) * 0.25); im.setColorAt(i, C);
  }
  im.castShadow = true; im.receiveShadow = true; root.add(im); return im;
};

/** a framed window: frame, sill, mullions, glass, dark interior box behind (from outside) */
export const windowFrame = (mb: MB, root: THREE.Object3D, cx: number, cy: number, z: number, w: number, h: number, facing: 1 | -1, o: { cols?: number; rows?: number; frame?: string; interior?: boolean; axis?: "z" | "x" } = {}) => {
  const fr = wood("wood_peeling_paint_weathered", o.frame ?? "#e8dcc4", 1.0), th = 0.07, dp = 0.12;
  const X = (dx: number, dz: number): V3 => (o.axis === "x" ? [z + dz * facing, cy, cx + dx] : [cx + dx, cy, z + dz * facing]);
  const add = (dx: number, dy: number, sw: number, sh: number, sd: number, dz = 0) => { const p = X(dx, dz); p[1] += dy; mb.box(o.axis === "x" ? sd : sw, sh, o.axis === "x" ? sw : sd, fr, p); };
  add(0, h / 2 + th / 2, w + th * 2, th, dp); add(0, -h / 2 - th / 2, w + th * 2 + 0.1, th * 1.3, dp + 0.08, 0.04);
  add(-w / 2 - th / 2, 0, th, h, dp); add(w / 2 + th / 2, 0, th, h, dp);
  const cols = o.cols ?? 2, rows = o.rows ?? 2;
  for (let i = 1; i < cols; i++) add(-w / 2 + (w * i) / cols, 0, 0.035, h, 0.05);
  for (let j = 1; j < rows; j++) add(0, -h / 2 + (h * j) / rows, w, 0.035, 0.05);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass());
  const gp = X(0, -0.01); gl.position.set(gp[0], gp[1], gp[2]); gl.rotation.y = o.axis === "x" ? (facing > 0 ? Math.PI / 2 : -Math.PI / 2) : facing > 0 ? 0 : Math.PI; gl.renderOrder = 2; root.add(gl);
  return gl;
};

/** height-field terrain with metre UVs (rock / grass tint by slope through vertex colours) */
export const terrain = (root: THREE.Object3D, x0: number, x1: number, z0: number, z1: number, nx: number, nz: number, hf: (x: number, z: number) => number, m: THREE.Material) => {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
  const p = g.attributes.position as THREE.BufferAttribute, uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, hf(x, z)); uv.setXY(i, x / 6, z / 6); }
  g.computeVertexNormals();
  const nrm = g.attributes.normal as THREE.BufferAttribute, cols = new Float32Array(p.count * 3), slope = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) { const up = nrm.getY(i), v = 0.86 + 0.14 * hsh(i, 3); slope[i] = cl((0.93 - up) / 0.2); cols[i * 3] = v; cols[i * 3 + 1] = v * 0.98; cols[i * 3 + 2] = v * 0.95; }
  g.setAttribute("color", new THREE.BufferAttribute(cols, 3)); g.setAttribute("slope", new THREE.BufferAttribute(slope, 1));
  const me = new THREE.Mesh(g, m); me.receiveShadow = true; me.castShadow = true; root.add(me); return me;
};
export { planeM, boxM };

/** the terrain material: rocky photo texture on slopes, dry sparse grass on the flats (blended by the slope attribute) */
export const terrainMat = () => {
  const m = phMat("rocky_terrain_02", 1, 1, { tint: "#e4d6c4", rough: 1, env: 0.45, key: "terrainSplat" }).clone();
  m.vertexColors = true;
  const grass = phTexture("sparse_grass", "diff");
  m.onBeforeCompile = (sh) => {
    sh.uniforms.map2 = { value: grass };
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute float slope; varying float vSlope; varying vec2 vUv2;").replace("#include <uv_vertex>", "#include <uv_vertex>\n  vSlope = slope; vUv2 = uv * 1.7;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform sampler2D map2; varying float vSlope; varying vec2 vUv2;").replace("#include <map_fragment>", "#include <map_fragment>\n  vec4 g2 = texture2D(map2, vUv2); diffuseColor.rgb = mix(g2.rgb * vec3(1.02, 0.94, 0.74), diffuseColor.rgb, smoothstep(0.15, 0.75, vSlope));");
  };
  m.customProgramCacheKey = () => "terrainSplat1";
  return m;
};
