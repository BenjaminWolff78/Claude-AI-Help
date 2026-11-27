// Helpers for the harbor set (2026-11-26): small math, canvas signs, a rope tube that is rebuilt in place every frame,
// the procedural boat hulls, the water surface (vertex waves + a scrolled normal map) and the shared wave function that
// the boats, ropes and the shot code all sample, so a boat sits on the same wave the water draws.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { staticFile, delayRender, continueRender } from "remotion";
import { phMat, phTexture, EXTRA_TEX } from "../ph";
import type { V3 } from "./types";

export const TAU = Math.PI * 2;
export const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const sm = (x: number, a = 0, b = 1) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const hsh = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** the water's waves: the same formula as the vertex shader (A = amplitude in metres) */
export const waveH = (x: number, z: number, t: number, A: number) =>
  A * (0.5 * Math.sin(0.42 * x + 0.9 * t) + 0.32 * Math.sin(0.4 * z - 1.25 * t + 0.2 * x) + 0.18 * Math.sin(0.62 * x + 0.85 * z + 2.0 * t));

// ------------------------------------------------------------------ materials ------------------------------------------------
export const std = (color: string, rough = 0.7, metal = 0, o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...o });
export const gloss = (color: string, clear = 1, rough = 0.28) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: rough, metalness: 0, clearcoat: clear, clearcoatRoughness: 0.08 });
export const chrome = () => new THREE.MeshStandardMaterial({ color: "#d8dde4", roughness: 0.16, metalness: 1.0 });
export const galv = () => new THREE.MeshStandardMaterial({ color: "#9aa0a6", roughness: 0.42, metalness: 0.75 });
export const glassDark = () => new THREE.MeshPhysicalMaterial({ color: "#1c2a36", roughness: 0.06, metalness: 0.2, clearcoat: 1 });

/** a canvas texture (sRGB) */
const CT = new Map<string, THREE.CanvasTexture>();
export const canvasTex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  let t = CT.get(key);
  if (!t) {
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    draw(cv.getContext("2d")!);
    t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; CT.set(key, t);
  }
  return t;
};
/** a painted sign: lines of text centred, with a weathered background */
export const signTex = (key: string, w: number, h: number, bg: string, fg: string, lines: { t: string; s: number; y: number; c?: string; font?: string }[], border?: string) =>
  canvasTex(key, w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${i % 2 ? 0 : 255},${i % 2 ? 0 : 255},${i % 2 ? 0 : 255},${0.025 + (i % 7) * 0.004})`; const x = ((i * 97) % w), y = ((i * 53) % h); g.fillRect(x, y, 3 + (i % 11) * 4, 2 + (i % 5)); }
    if (border) { g.strokeStyle = border; g.lineWidth = Math.max(6, w * 0.018); g.strokeRect(g.lineWidth, g.lineWidth, w - 2 * g.lineWidth, h - 2 * g.lineWidth); }
    g.textAlign = "center"; g.textBaseline = "middle";
    for (const L of lines) { g.fillStyle = L.c ?? fg; g.font = `${L.font ?? "900"} ${L.s}px "DejaVu Sans", Arial, sans-serif`; g.fillText(L.t, w / 2, L.y); }
  });

// ------------------------------------------------------------------ rope -------------------------------------------------------
/** a rope tube with N points x M sides; set(points) rewrites the vertices in place */
export class Rope {
  mesh: THREE.Mesh; private N: number; private M: number; private r: number; private pos: Float32Array;
  constructor(N: number, r: number, mat: THREE.Material, M = 6) {
    this.N = N; this.M = M; this.r = r;
    const g = new THREE.BufferGeometry(); this.pos = new Float32Array(N * (M + 1) * 3);
    const uv = new Float32Array(N * (M + 1) * 2), idx: number[] = [];
    for (let i = 0; i < N; i++) for (let j = 0; j <= M; j++) { const k = i * (M + 1) + j; uv[k * 2] = i * 0.6; uv[k * 2 + 1] = j / M; }
    for (let i = 0; i < N - 1; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + M + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, mat); this.mesh.castShadow = true; this.mesh.frustumCulled = false;
  }
  set(P: V3[]) {
    const { N, M, r } = this; const up = new THREE.Vector3(0, 1, 0), T = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const p = P[Math.min(i, P.length - 1)], q = P[Math.min(i + 1, P.length - 1)], o = P[Math.max(i - 1, 0)];
      T.set(q[0] - o[0], q[1] - o[1], q[2] - o[2]).normalize();
      A.crossVectors(T, Math.abs(T.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : up).normalize(); B.crossVectors(T, A).normalize();
      for (let j = 0; j <= M; j++) {
        const a = (j / M) * TAU, k = (i * (M + 1) + j) * 3;
        this.pos[k] = p[0] + r * (Math.cos(a) * A.x + Math.sin(a) * B.x);
        this.pos[k + 1] = p[1] + r * (Math.cos(a) * A.y + Math.sin(a) * B.y);
        this.pos[k + 2] = p[2] + r * (Math.cos(a) * A.z + Math.sin(a) * B.z);
      }
    }
    const g = this.mesh.geometry; (g.attributes.position as THREE.BufferAttribute).needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
  }
}
/** the points of a rope of length Lr hung between A and B (a parabola whose arc matches Lr; straight when taut),
 *  floating on the water (never below the level + 2 cm) */
export const hang = (A: V3, B: V3, Lr: number, N: number, floor = -99): V3[] => {
  const c = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]) || 1e-3;
  const d = Lr > c ? Math.sqrt((3 * c * (Lr - c)) / 8) : 0;
  const out: V3[] = [];
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    out.push([lerp(A[0], B[0], u), Math.max(floor, lerp(A[1], B[1], u) - 4 * d * u * (1 - u)), lerp(A[2], B[2], u)]);
  }
  return out;
};

// ------------------------------------------------------------------ boats ------------------------------------------------------
export type HullSpec = { L: number; B: number; fb: number; bowRise: number; draft: number; deckDrop: number; stern: number };
/** a hull from stations along z (stern -L/2 .. bow +L/2); topsides / boot stripe / bottom paint by vertex colour */
export const hullGeo = (h: HullSpec, top: string, boot: string, bottom: string) => {
  const NS = 26, cross = 9; const pos: number[] = [], col: number[] = [], uv: number[] = [], idx: number[] = [];
  const cT = new THREE.Color(top), cB = new THREE.Color(boot), cBo = new THREE.Color(bottom);
  const halfW = (s: number) => {
    if (s < 0.5) return (h.B / 2) * (h.stern + (1 - h.stern) * Math.sin((s / 0.5) * Math.PI / 2));
    return (h.B / 2) * Math.pow(Math.cos(((s - 0.5) / 0.5) * Math.PI / 2), 0.7);
  };
  const gun = (s: number) => h.fb + h.bowRise * s * s;
  const keel = (s: number) => lerp(-h.draft, -h.draft * 0.35, s) + (s > 0.86 ? (gun(s) + h.draft) * Math.pow((s - 0.86) / 0.14, 2) * 0.9 : 0);
  const ring = (s: number): [number, number][] => {
    const w = Math.max(0.004, halfW(s)), g = gun(s), k = keel(s);
    // gunwale -> chine -> bilge -> keel, both sides
    const half: [number, number][] = [[w, g], [w * 0.99, lerp(g, 0.1, 0.55)], [w * 0.96, 0.1], [w * 0.92, 0.02], [w * 0.72, lerp(0, k, 0.5)], [0, k]];
    return [...half.map(([x, y]) => [-x, y] as [number, number]), ...half.slice(0, -1).reverse()];
  };
  const NC = ring(0).length; void cross;
  for (let i = 0; i <= NS; i++) {
    const s = i / NS, z = -h.L / 2 + s * h.L, R = ring(s); let arc = 0;
    for (let j = 0; j < NC; j++) {
      const [x, y] = R[j]; if (j) arc += Math.hypot(x - R[j - 1][0], y - R[j - 1][1]);
      pos.push(x, y, z); uv.push(z, arc);
      const c = y > 0.1 ? cT : y > -0.02 ? cB : cBo; col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NC - 1; j++) { const a = i * NC + j, b = a + NC; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  // transom (s = 0): a fan
  const base = pos.length / 3, R0 = ring(0); let cy = 0; R0.forEach(([, y]) => (cy += y / R0.length));
  pos.push(0, cy, -h.L / 2); uv.push(0, 0); col.push(cT.r, cT.g, cT.b);
  R0.forEach(([x, y]) => { pos.push(x, y, -h.L / 2); uv.push(x, y); const c = y > 0.1 ? cT : y > -0.02 ? cB : cBo; col.push(c.r, c.g, c.b); });
  for (let j = 0; j < R0.length - 1; j++) idx.push(base, base + 2 + j, base + 1 + j);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return { g, halfW, gun };
};
/** the deck: a flat plate inside the hull at gunwale - deckDrop, plus the inside of the bulwark */
export const deckGeo = (h: HullSpec, halfW: (s: number) => number, gun: (s: number) => number) => {
  const NS = 24, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= NS; i++) {
    const s = i / NS * 0.985, z = -h.L / 2 + s * h.L, w = halfW(s) * 0.93, d = gun(s) - h.deckDrop;
    pos.push(-w, d, z, w, d, z, -w * 0.995, gun(s) - 0.02, z, w * 0.995, gun(s) - 0.02, z);
    uv.push(-w, z, w, z, -w, z + 0.3, w, z + 0.3);
  }
  for (let i = 0; i < NS; i++) {
    const a = i * 4, b = a + 4;
    idx.push(a, b, a + 1, a + 1, b, b + 1);        // floor (faces up)
    idx.push(a + 2, b + 2, a, a, b + 2, b);         // port bulwark inside
    idx.push(a + 1, b + 1, a + 3, a + 3, b + 1, b + 3); // starboard bulwark inside
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
};
export const rbox = (w: number, h: number, d: number, r = 0.05, seg = 3) => new RoundedBoxGeometry(w, h, d, seg, r);
export const tubeAlong = (pts: V3[], r: number, mat: THREE.Material, closed = false) =>
  new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), closed), Math.max(12, pts.length * 8), r, 8, closed), mat);
/** a horn cleat (galvanised): base + horn, 0.3 m long along x */
export const cleat = (m: THREE.Material) => {
  const g = new THREE.Group();
  const horn = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.26, 4, 10).rotateZ(Math.PI / 2), m); horn.position.y = 0.075; g.add(horn);
  for (const x of [-0.06, 0.06]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.034, 0.075, 10), m); b.position.set(x, 0.037, 0); g.add(b); }
  g.traverse((o) => { (o as THREE.Mesh).castShadow = true; }); return g;
};

// ------------------------------------------------------------------ water ------------------------------------------------------
export type WaterU = { uTime: { value: number }; uAmp: { value: number }; uDeep: { value: THREE.Color }; uShallow: { value: THREE.Color }; uEnvK: { value: number } };
export const waterMesh = (size: number, seg: number) => {
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
  let nt = EXTRA_TEX.waternormals; if (!nt) { const hN = delayRender("water normals", { timeoutInMilliseconds: 120000 }); nt = new THREE.TextureLoader().load(staticFile("tex/waternormals.jpg"), () => continueRender(hN), undefined, () => continueRender(hN)); } nt.wrapS = nt.wrapT = THREE.RepeatWrapping; nt.repeat.set(size / 9, size / 9);
  const m = new THREE.MeshStandardMaterial({ color: "#1e5a6c", roughness: 0.13, metalness: 0.0, normalMap: nt, normalScale: new THREE.Vector2(0.55, 0.55), envMapIntensity: 0.38 });
  const U: WaterU = { uTime: { value: 0 }, uAmp: { value: 0.1 }, uDeep: { value: new THREE.Color("#15404e") }, uShallow: { value: new THREE.Color("#2c7a84") }, uEnvK: { value: 0.4 } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = "uniform float uTime; uniform float uAmp; varying float vCrest;\n" + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
      vec4 wp0 = modelMatrix * vec4(transformed, 1.0);
      float wx = wp0.x, wz = wp0.z;
      float hh = uAmp * (0.5 * sin(0.42 * wx + 0.9 * uTime) + 0.32 * sin(0.4 * wz - 1.25 * uTime + 0.2 * wx) + 0.18 * sin(0.62 * wx + 0.85 * wz + 2.0 * uTime));
      transformed.y += hh; vCrest = hh / max(uAmp, 0.001);`).replace("#include <beginnormal_vertex>", `#include <beginnormal_vertex>
      { vec4 wq = modelMatrix * vec4(position, 1.0); float x = wq.x, z = wq.z;
        float dx = uAmp * (0.5 * 0.42 * cos(0.42 * x + 0.9 * uTime) + 0.32 * 0.2 * cos(0.4 * z - 1.25 * uTime + 0.2 * x) + 0.18 * 0.62 * cos(0.62 * x + 0.85 * z + 2.0 * uTime));
        float dz = uAmp * (0.32 * 0.4 * cos(0.4 * z - 1.25 * uTime + 0.2 * x) + 0.18 * 0.85 * cos(0.62 * x + 0.85 * z + 2.0 * uTime));
        objectNormal = normalize(vec3(-dx, 1.0, -dz)); }`);
    sh.fragmentShader = "uniform vec3 uDeep; uniform vec3 uShallow; uniform float uAmp; uniform float uEnvK; varying float vCrest;\n" + sh.fragmentShader.replace("#include <lights_fragment_maps>", "#include <lights_fragment_maps>\n  radiance *= uEnvK; iblIrradiance *= uEnvK;").replace("#include <color_fragment>", `#include <color_fragment>
      diffuseColor.rgb = mix(uDeep, uShallow, clamp(0.5 + 0.5 * vCrest, 0.0, 1.0));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.9, 0.92), smoothstep(0.7, 0.98, vCrest) * clamp(uAmp * 0.8, 0.0, 0.3));`);
  };
  const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true;
  return { mesh, U, normalTex: nt, mat: m };
};

/** a soft white radial foam ring sprite (lies flat on the water) */
export const foamTex = () => canvasTex("foamring", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 18, 64, 64, 62); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.45, "rgba(255,255,255,0.85)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + (i % 5) * 0.1})`; const a = (i / 90) * TAU, r = 40 + (i % 7) * 3; g.beginPath(); g.arc(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 2 + (i % 3), 0, TAU); g.fill(); }
});
export const wood = (rx: number, ry: number, tint = "#c8b49a") => phMat("weathered_planks", rx, ry, { tint, rough: 0.92 });
void phTexture;
