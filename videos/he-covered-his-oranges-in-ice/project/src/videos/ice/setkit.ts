// Shared set kit (used by every set file). Everything world-side uses two-tone lam() materials so it takes the
// skill's measured light; signs use an UNLIT face (readability trap: side-lit signs go grey); glows, mist and other
// soft cards live on the NOINK layer so the world ink never outlines them.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { lam, V, boxGeo, Batch } from "./build";
import { ctex, rng, beamHD, planksHD, waterNear, waterFar } from "./paint";
import { twoTone, LFB } from "./shade";
import { NOINK } from "./ink";

export type V3 = [number, number, number];
const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------------- glows, mist, light ----------------
const glowTex = () => ctex("glow", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.18, "rgba(255,255,255,0.65)"); gr.addColorStop(0.5, "rgba(255,255,255,0.16)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
/** additive glow card around a light source (bloom then picks up its HDR core) */
export const glow = (parent: THREE.Object3D, pos: V3, color: string, size: number, k = 1) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: new THREE.Color(color).multiplyScalar(1.4 * k), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
  s.scale.set(size, size, 1); s.position.set(...pos); s.layers.set(NOINK); s.renderOrder = 4; parent.add(s); return s;
};
const mistTex = () => ctex("mist", 256, 256, (g) => {
  const r = rng(7);
  for (let i = 0; i < 14; i++) { const x = 60 + r() * 136, y = 70 + r() * 116, rr = 30 + r() * 40; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, "rgba(255,255,255,0.55)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }
});
/** soft cold-mist / steam / dust puff card (camera-facing); update its opacity/scale from pose() */
export const mist = (parent: THREE.Object3D, pos: V3, size: number, color = "#eaf8ff", op = 0.6) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex(), color, transparent: true, opacity: op, depthWrite: false, fog: true }));
  s.scale.set(size, size * 0.7, 1); s.position.set(...pos); s.layers.set(NOINK); s.renderOrder = 3; parent.add(s); return s;
};
/** god-ray light shaft (window beam, door spill, sun shaft) */
export const shaft = (parent: THREE.Object3D, from: V3, to: V3, width: number, color: string, op = 0.22) => {
  const tex = ctex("shaft", 64, 256, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    const g2 = g.createLinearGradient(0, 0, 64, 0); g2.addColorStop(0, "rgba(0,0,0,1)"); g2.addColorStop(0.25, "rgba(0,0,0,0)"); g2.addColorStop(0.75, "rgba(0,0,0,0)"); g2.addColorStop(1, "rgba(0,0,0,1)");
    g.globalCompositeOperation = "destination-out"; g.fillStyle = g2; g.fillRect(0, 0, 64, 256);
  });
  const a = V(...from), b = V(...to), len = a.distanceTo(b);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, len), new THREE.MeshBasicMaterial({ map: tex, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.geometry.translate(0, -len / 2, 0); m.position.copy(a);
  m.quaternion.setFromUnitVectors(V(0, -1, 0), b.clone().sub(a).normalize()); m.layers.set(NOINK); m.renderOrder = 4; parent.add(m); return m;
};
/** a lamp that glows AND lights the set (point light, picked up by the two-tone lamp term). kind: post | hang | wall | table */
export const lamp = (parent: THREE.Object3D, pos: V3, color = "#ffb45a", intensity = 6, dist = 8, kind: "post" | "hang" | "wall" | "table" = "post") => {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const iron = lam("lampIron", () => ({ color: "#3a3440" }));
  const add = (geo: THREE.BufferGeometry, m: THREE.Material) => { const me = new THREE.Mesh(geo, m); me.castShadow = true; me.receiveShadow = true; g.add(me); return me; };
  if (kind === "post") { add(new THREE.CylinderGeometry(0.05, 0.07, pos[1], 8).translate(0, -pos[1] / 2, 0), iron); add(new THREE.BoxGeometry(0.4, 0.05, 0.05).translate(0.17, 0.27, 0), iron); }
  if (kind === "hang") add(new THREE.CylinderGeometry(0.008, 0.008, 0.6, 4).translate(0, 0.45, 0), iron);
  if (kind === "wall") add(new THREE.BoxGeometry(0.05, 0.05, 0.35).translate(0, 0.27, -0.17), iron);
  const lx = kind === "post" ? 0.34 : 0;
  add(new THREE.ConeGeometry(0.17, 0.12, 4).rotateY(Math.PI / 4).translate(lx, 0.22, 0), iron);
  add(new THREE.BoxGeometry(0.2, 0.04, 0.2).translate(lx, -0.14, 0), iron);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.26, 0.16).translate(lx, 0.03, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.2), toneMapped: true }));
  glass.layers.set(NOINK); g.add(glass);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.BoxGeometry(0.02, 0.28, 0.02).translate(lx + sx * 0.085, 0.03, sz * 0.085), iron);
  const L = new THREE.PointLight(color, intensity, dist, 1.4); L.position.set(lx, 0.03, 0.15); g.add(L);
  const gl = glow(g, [lx, 0.03, 0.02], color, 1.3);
  g.userData = { light: L, glow: gl, base: intensity, seed: rnd(pos[0] * 3 + pos[2]) * 10 };
  return g;
};
/** gentle flame flicker for a lamp/candle group from lamp() */
export const flicker = (l: THREE.Object3D, t: number) => {
  const u = l.userData; const f = 0.9 + 0.1 * Math.sin(t * 13 + u.seed) * Math.sin(t * 5.3 + u.seed * 2);
  u.light.intensity = u.base * f; (u.glow.material as THREE.SpriteMaterial).opacity = 0.75 + 0.25 * f;
};

// ---------------- painted textures for props ----------------
/** stencil label canvas: bold painted letters, slightly worn */
export const stencilTex = (text: string, fg = "#2a1a10", bg: string | null = null, w = 512, h = 192) => ctex(`stencil|${text}|${fg}|${bg}|${w}x${h}`, w, h, (g, r) => {
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  const lines = text.split("\n"); let fs = (h * 0.72) / lines.length;
  g.font = `900 ${fs}px Georgia, serif`; g.textAlign = "center"; g.textBaseline = "middle";
  const mw = Math.max(...lines.map((l) => g.measureText(l).width)); if (mw > w * 0.86) { fs *= (w * 0.86) / mw; g.font = `900 ${fs}px Georgia, serif`; }
  g.fillStyle = fg; lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * fs * 1.08));
  if (!bg) { g.globalCompositeOperation = "destination-out"; for (let i = 0; i < 260; i++) { g.globalAlpha = 0.5 * r(); g.fillRect(r() * w, r() * h, 2 + r() * 6, 1 + r() * 3); } }
});
/** a readable sign: wooden frame + unlit painted face (text always fits inside, master prompt detail 9) */
export const sign = (parent: THREE.Object3D, text: string, w: number, h: number, pos: V3, yaw = 0, bg = "#f2e2b0", fg = "#3a1e10") => {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = yaw; parent.add(g);
  const fr = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, h + 0.12, 0.08), lam("signFrame", () => ({ map: beamHD() })));
  fr.castShadow = true; g.add(fr);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: stencilTex(text, fg, bg, 768, Math.round(768 * h / w)), toneMapped: true }));
  face.position.z = 0.045; g.add(face);
  return g;
};

// ---------------- the ICE BLOCK (title thing: most detailed prop in the film) ----------------
const iceTex = () => ctex("iceHD", 512, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 512, 512); gr.addColorStop(0, "#f2fdff"); gr.addColorStop(0.45, "#bdeefa"); gr.addColorStop(1, "#86d3ee");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  // trapped air bubbles + inner cracks
  for (let i = 0; i < 70; i++) { const x = r() * 512, y = r() * 512, rr = 2 + r() * 7; g.strokeStyle = "rgba(255,255,255,0.75)"; g.lineWidth = 2; g.beginPath(); g.arc(x, y, rr, 0, 7); g.stroke(); g.fillStyle = "rgba(255,255,255,0.25)"; g.fill(); }
  g.strokeStyle = "rgba(255,255,255,0.8)"; g.lineWidth = 3;
  for (let i = 0; i < 9; i++) { let x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 120; y += (r() - 0.5) * 120; g.lineTo(x, y); } g.stroke(); }
  // frost rim + bevel highlights (painted, so even the flat faces read as rounded ice)
  const fr = g.createLinearGradient(0, 0, 0, 512); fr.addColorStop(0, "rgba(255,255,255,0.75)"); fr.addColorStop(0.12, "rgba(255,255,255,0)"); fr.addColorStop(0.88, "rgba(255,255,255,0)"); fr.addColorStop(1, "rgba(255,255,255,0.55)");
  g.fillStyle = fr; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(255,255,255,0.95)"; g.lineWidth = 16; g.strokeRect(14, 14, 484, 484);
  g.strokeStyle = "rgba(60,140,190,0.55)"; g.lineWidth = 5; g.strokeRect(4, 4, 504, 504);
  g.fillStyle = "rgba(255,255,255,0.9)"; g.beginPath(); g.moveTo(40, 40); g.lineTo(200, 40); g.lineTo(40, 150); g.closePath(); g.fill();
  g.fillStyle = "rgba(255,255,255,0.6)"; g.beginPath(); g.moveTo(230, 40); g.lineTo(270, 40); g.lineTo(60, 200); g.lineTo(40, 200); g.closePath(); g.fill();
});
let iceMat: THREE.MeshPhongMaterial | null = null;
export const iceMaterial = () => {
  if (!iceMat) {
    iceMat = twoTone(new THREE.MeshPhongMaterial({ map: iceTex(), color: "#d6f2ff", emissive: new THREE.Color("#4fbfe8"), emissiveIntensity: 0.3, specular: "#ffffff", shininess: 90, transparent: true, opacity: 0.9 }), 0.4);
  }
  return iceMat;
};

let coreM: THREE.Material | null = null, hiM: THREE.Material | null = null;
const coreMat = () => (coreM ??= new THREE.MeshBasicMaterial({ color: "#d4f3ff", transparent: true, opacity: 0.28, depthWrite: false }));
const hiMat = () => (hiM ??= new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.85 }));
const glintTex = () => ctex("glint4", 64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(220,248,255,0.7)"); gr.addColorStop(1, "rgba(220,248,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.fillStyle = "rgba(255,255,255,0.95)"; g.beginPath(); g.moveTo(32, 0); g.lineTo(35, 29); g.lineTo(64, 32); g.lineTo(35, 35); g.lineTo(32, 64); g.lineTo(29, 35); g.lineTo(0, 32); g.lineTo(29, 29); g.closePath(); g.fill(); });
/** iron ice tongs (two crossed hooked jaws on a pivot, ring handles), standing open as if gripping a block of width `grip` */
export const tongs3D = (parent: THREE.Object3D, pos: V3, yaw = 0, s = 1, grip = 0.5) => {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = yaw; g.scale.setScalar(s); parent.add(g);
  const iron = twoTone(new THREE.MeshPhongMaterial({ color: "#454956", specular: "#c9d2e0", shininess: 60 }));
  for (const sd of [-1, 1]) {
    const c = new THREE.CatmullRomCurve3([V(sd * 0.1, 0.95, 0), V(sd * 0.05, 0.8, 0), V(0, 0.68, 0), V(-sd * grip * 0.55, 0.5, 0), V(-sd * grip * 0.62, 0.28, 0), V(-sd * grip * 0.5, 0.12, 0), V(-sd * grip * 0.36, 0.1, 0)]);
    const m = new THREE.Mesh(new THREE.TubeGeometry(c, 32, 0.022, 7), iron); m.castShadow = true; g.add(m);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 6, 16), iron); ring.position.set(sd * 0.13, 1.0, 0); g.add(ring);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 8), iron); tip.position.set(-sd * grip * 0.33, 0.1, 0); tip.rotation.z = sd * Math.PI / 2; g.add(tip);
  }
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 10), iron); pin.rotation.x = Math.PI / 2; pin.position.y = 0.68; g.add(pin);
  return g;
};
export type Ice = { g: THREE.Group; set: (melt: number, t?: number) => void; mists: THREE.Sprite[] };
/** w x h x d block standing on y = 0 of its group: bevelled translucent body, frost cap, drips, cold mist.
 *  set(melt 0..1, t): shrinks it toward a small rounded lump and grows a glossy puddle under it. */
export const iceBlock = (parent: THREE.Object3D, w: number, h: number, d: number, pos: V3, o: { mist?: boolean; puddle?: boolean; seed?: number } = {}): Ice => {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.12), iceMaterial());
  body.geometry.translate(0, h / 2, 0); body.castShadow = true; body.receiveShadow = true; g.add(body);
  const frost = new THREE.Mesh(new RoundedBoxGeometry(w * 0.96, h * 0.06, d * 0.96, 2, h * 0.025), lam("frost", () => ({ color: "#f4fbff" })));
  frost.position.y = h * 0.985; g.add(frost);
  const drips: THREE.Mesh[] = [];
  const dm = twoTone(new THREE.MeshPhongMaterial({ color: "#bfeaff", emissive: new THREE.Color("#5fc4e8"), emissiveIntensity: 0.3, transparent: true, opacity: 0.85, shininess: 80 }));
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), dm); m.scale.set(1, 1.6, 1); g.add(m); drips.push(m); }
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 32), twoTone(new THREE.MeshPhongMaterial({ color: "#7fc8e8", specular: "#ffffff", shininess: 120, transparent: true, opacity: 0.75 })));
  puddle.rotation.x = -Math.PI / 2; puddle.position.y = 0.006; puddle.receiveShadow = true; puddle.visible = !!o.puddle; g.add(puddle);
  const mists = o.mist ? [0, 1].map((i) => mist(g, [(i - 0.5) * w * 0.6, h * 0.9, d * 0.3], Math.max(w, d) * 0.9, "#eef9ff", 0.35)) : [];
  // depth: a paler inner core seen through the shell, bevel highlights on the top edges, two twinkling glints
  const core = new THREE.Mesh(new RoundedBoxGeometry(w * 0.78, h * 0.78, d * 0.78, 2, Math.min(w, h, d) * 0.1), coreMat());
  core.position.y = h / 2; core.layers.set(NOINK); core.renderOrder = -0.1; body.add(core);
  for (const [ax, az, len] of [[0, d / 2, w * 0.82], [0, -d / 2, w * 0.82]] as [number, number, number][]) { const e = new THREE.Mesh(new THREE.BoxGeometry(len, 0.014, 0.014), hiMat()); e.position.set(ax, h * 0.955, az * 0.985); e.layers.set(NOINK); body.add(e); }
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.014, h * 0.72, 0.014), hiMat()); e.position.set(sx * w * 0.47, h * 0.5, d * 0.495); e.layers.set(NOINK); body.add(e); }
  const glints = [0, 1].map((i) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glintTex(), color: "#ffffff", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); m.position.set((i ? 0.42 : -0.3) * w, h * (i ? 0.97 : 0.62), d * 0.51); m.layers.set(NOINK); body.add(m); return m; });
  const seed = o.seed ?? 1;
  const ice: Ice = {
    g, mists,
    set: (melt, t = 0) => {
      const s = 1 - 0.72 * melt;
      body.scale.set(1 - 0.55 * melt, s, 1 - 0.55 * melt); frost.position.y = h * 0.985 * s; frost.scale.set(1 - 0.55 * melt, 1, 1 - 0.55 * melt);
      frost.visible = melt < 0.6;
      puddle.visible = !!o.puddle || melt > 0.02; puddle.scale.setScalar(Math.max(w, d) * (0.45 + 1.4 * melt));
      drips.forEach((m, i) => { const u = (t * 0.9 + i * 0.27 + seed) % 1; m.position.set((i % 2 ? 0.45 : -0.45) * w * (1 - 0.55 * melt), h * s * (0.5 - 0.5 * u), (i < 2 ? 0.5 : -0.5) * d * (1 - 0.55 * melt) + 0.02); m.visible = u < 0.95; });
      glints.forEach((m, i) => { const ph = (t * 0.45 + i * 0.5 + seed * 0.37) % 1, k = ph < 0.18 ? Math.sin((ph / 0.18) * Math.PI) : 0; m.visible = k > 0.02 && melt < 0.7; m.scale.setScalar(0.06 + 0.16 * k); (m.material as THREE.SpriteMaterial).rotation = t * 0.8 + i; });
      mists.forEach((m, i) => { const u = (t * 0.25 + i * 0.5) % 1; m.position.y = h * s * (0.85 + 0.5 * u); (m.material as THREE.SpriteMaterial).opacity = 0.35 * Math.sin(Math.PI * u); m.scale.set(Math.max(w, d) * (0.7 + 0.5 * u), Math.max(w, d) * 0.5 * (0.7 + 0.5 * u), 1); });
    },
  };
  ice.set(0, 0);
  return ice;
};
/** a crate of sawdust packing with a block inside (lid off): the block peeks out of golden sawdust */
export const sawdustCrate = (parent: THREE.Object3D, pos: V3, s = 1, label = "SAWDUST") => {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const b = new Batch();
  const wood = lam("crateWood", () => ({ map: beamHD() }));
  b.add(boxGeo(V(-0.6 * s, 0, -0.45 * s), V(0.6 * s, 0.08 * s, 0.45 * s)), wood);
  for (const [x0, x1, z0, z1] of [[-0.6, 0.6, -0.45, -0.38], [-0.6, 0.6, 0.38, 0.45], [-0.6, -0.53, -0.45, 0.45], [0.53, 0.6, -0.45, 0.45]]) b.add(boxGeo(V(x0 * s, 0, z0 * s), V(x1 * s, 0.7 * s, z1 * s)), wood);
  b.build(g);
  const dust = new THREE.Mesh(new THREE.BoxGeometry(1.06 * s, 0.1, 0.76 * s), lam("sawdustFill", () => ({ map: sawdustTex() })));
  dust.position.y = 0.62 * s; dust.receiveShadow = true; g.add(dust);
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.9 * s, 0.26 * s), new THREE.MeshBasicMaterial({ map: stencilTex(label, "#2a1a10"), transparent: true }));
  lab.position.set(0, 0.38 * s, 0.452 * s); g.add(lab);
  return { g, dust };
};
export const sawdustTex = () => ctex("sawdustHD", 512, 512, (g, r) => {
  g.fillStyle = "#d9a95a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5000; i++) { g.fillStyle = r() < 0.5 ? "rgba(156,106,42,0.35)" : "rgba(246,213,142,0.55)"; g.fillRect(r() * 512, r() * 512, 1 + r() * 3, 1 + r() * 2); }
  for (let i = 0; i < 300; i++) { g.strokeStyle = "rgba(184,138,64,0.6)"; g.lineWidth = 2; g.beginPath(); const x = r() * 512, y = r() * 512; g.arc(x, y, 3 + r() * 5, r() * 6, r() * 6 + 2); g.stroke(); }
});

// ---------------- crates, barrels, sacks, rope ----------------
/** a shipping crate: bevelled body, corner posts and rails, and (by seed) its own size, wood tint and wear, a nailed
 *  lid that overhangs a little, rope lashings, a scuffed corner. o.w/h/d override the size (default s cube). */
export const crate = (b: Batch, parent: THREE.Object3D, pos: V3, s = 0.75, label?: string, yaw = 0, o: { w?: number; h?: number; d?: number; seed?: number } = {}) => {
  const [x, y, z] = pos, seed = o.seed ?? Math.round(x * 13.1 + y * 7.7 + z * 3.3), R = rng(1000 + (seed >>> 0) % 997);
  const w = o.w ?? s * (0.88 + R() * 0.2), hh = o.h ?? s, d = o.d ?? s * (0.86 + R() * 0.26), hw = w / 2, hd = d / 2;   // no two crates the same footprint
  const TINTS = ["#ffffff", "#e6d2b4", "#c9b08e", "#d2cfc6", "#f2dcc0"], tint = TINTS[Math.floor(R() * TINTS.length)];
  const wood = lam("crateWood" + tint, () => ({ map: beamHD(), color: tint })), dark = lam("crateDark", () => ({ color: "#6a4527" }));
  const rope = lam("crateRope", () => ({ color: "#b8955a" })), lidM = lam("crateLid" + tint, () => ({ map: planksHD(), color: tint }));
  const M = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);
  const add = (min: THREE.Vector3, max: THREE.Vector3, m: THREE.Material) => b.add(boxGeo(min, max, 1).applyMatrix4(M), m);
  b.add(new RoundedBoxGeometry(w, hh, d, 2, Math.min(0.045, Math.min(w, hh, d) * 0.06)).translate(0, hh / 2, 0).applyMatrix4(M), wood);   // bevelled body
  for (const yy of [0.03, hh - 0.03]) for (const zz of [-1, 1]) add(V(-hw - 0.01, yy - 0.04, zz * hd - 0.04), V(hw + 0.01, yy + 0.04, zz * hd + 0.04), dark);
  for (const xx of [-1, 1]) for (const zz of [-1, 1]) add(V(xx * hw - 0.04, 0, zz * hd - 0.04), V(xx * hw + 0.04, hh, zz * hd + 0.04), dark);
  // lid: three planks, overhanging and a touch askew
  if (R() < 0.75) { const sk = (R() - 0.5) * 0.06; for (let k = 0; k < 3; k++) b.add(new RoundedBoxGeometry(w + 0.05, 0.035, d / 3 - 0.01, 1, 0.012).translate(sk, hh + 0.017, -hd + d / 6 + (k * d) / 3).applyMatrix4(M), lidM); }
  // rope lashing over the top and down two sides
  if (R() < 0.45) { const rz = (R() - 0.5) * d * 0.4;
    b.add(new THREE.CylinderGeometry(0.018, 0.018, w + 0.04, 6).rotateZ(Math.PI / 2).translate(0, hh + 0.05, rz).applyMatrix4(M), rope);
    for (const sx of [-1, 1]) b.add(new THREE.CylinderGeometry(0.018, 0.018, hh, 6).translate(sx * (hw + 0.02), hh / 2, rz).applyMatrix4(M), rope); }
  // wear: a scuffed, darker corner patch
  if (R() < 0.5) add(V(hw - 0.02, R() * hh * 0.4, hd - 0.18), V(hw + 0.012, R() * hh * 0.4 + 0.2, hd - 0.02), lam("crateScuff", () => ({ color: "#5a4632" })));
  if (label) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.85, hh * 0.34), new THREE.MeshBasicMaterial({ map: stencilTex(label, "#2a1a10"), transparent: true }));
    l.position.set(0, hh * 0.5, hd + 0.045); const lg = new THREE.Group(); lg.add(l); lg.position.set(x, y, z); lg.rotation.y = yaw; parent.add(lg);
  }
};
export const barrel = (parent: THREE.Object3D, pos: V3, s = 0.42, yaw = 0) => {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = yaw; parent.add(g);
  const pts: THREE.Vector2[] = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(s * (0.84 + 0.16 * Math.sin(t * Math.PI)), t * s * 2.3)); }
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), lam("barrelWood", () => ({ map: barrelTex() }))); m.castShadow = m.receiveShadow = true; g.add(m);
  for (const ty of [0.16, 0.84]) { const r = new THREE.Mesh(new THREE.TorusGeometry(s * (0.85 + 0.16 * Math.sin(ty * Math.PI)), 0.022, 6, 24), lam("hoop", () => ({ color: "#3d3a44" }))); r.rotation.x = Math.PI / 2; r.position.y = ty * s * 2.3; g.add(r); }
  const lid = new THREE.Mesh(new THREE.CircleGeometry(s * 0.84, 20), lam("barrelTop", () => ({ map: beamHD() }))); lid.rotation.x = -Math.PI / 2; lid.position.y = s * 2.3; g.add(lid);
  return g;
};
const barrelTex = () => ctex("barrelTex", 512, 256, (g, r) => {
  for (let i = 0; i < 16; i++) { g.fillStyle = `hsl(${26 + r() * 6}, ${46 + r() * 10}%, ${34 + r() * 8}%)`; g.fillRect(i * 32, 0, 32, 256); g.fillStyle = "rgba(30,15,8,0.55)"; g.fillRect(i * 32, 0, 3, 256); }
  for (let i = 0; i < 300; i++) { g.fillStyle = "rgba(60,30,12,0.25)"; g.fillRect(r() * 512, r() * 256, 1, 10 + r() * 30); }
});
export const sack = (parent: THREE.Object3D, pos: V3, s = 0.36, col = "#cdb07a") => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(s, 14, 10), lam("sack" + col, () => ({ color: col })));
  m.scale.set(1, 1.15, 0.85); m.position.set(pos[0], pos[1] + s * 0.9, pos[2]); m.castShadow = m.receiveShadow = true; parent.add(m);
  const tie = new THREE.Mesh(new THREE.ConeGeometry(s * 0.35, s * 0.5, 8), lam("sack" + col, () => ({ color: col }))); tie.position.set(pos[0], pos[1] + s * 2.05, pos[2]); parent.add(tie);
  return m;
};
export const ropeCoil = (parent: THREE.Object3D, pos: V3, s = 0.35) => {
  for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(s - i * 0.05, 0.045, 6, 22), lam("rope", () => ({ color: "#c2a46a" }))); r.rotation.x = Math.PI / 2; r.position.set(pos[0], pos[1] + 0.05 + i * 0.075, pos[2]); r.castShadow = true; parent.add(r); }
};
/** a thin cylinder between two points (ropes, rigging, poles) */
export const rod = (parent: THREE.Object3D, a: V3, b: V3, r: number, m: THREE.Material) => {
  const A = V(...a), B = V(...b), me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, A.distanceTo(B), 5), m);
  me.position.copy(A.clone().add(B).multiplyScalar(0.5)); me.quaternion.setFromUnitVectors(V(0, 1, 0), B.clone().sub(A).normalize()); me.castShadow = true; parent.add(me); return me;
};

// ---------------- water (the template's river shader, generalised) ----------------
export const WATER_U = {
  wNearC: { value: new THREE.Color("#22a7b6") }, wMidC: { value: new THREE.Color("#167fb2") }, wFarC: { value: new THREE.Color("#1a5596") },
  wCrest: { value: new THREE.Color("#7ddfe8") }, wTrough: { value: new THREE.Color("#0e4a80") }, wGlint: { value: new THREE.Color("#ffffff") },
  wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) }, wNearTex: { value: null as THREE.Texture | null }, wFarTex: { value: null as THREE.Texture | null }, wTime: { value: 0 }, wFlow: { value: new THREE.Vector2(0.35, 0) },
};
let waterM: THREE.MeshLambertMaterial | null = null;
/** painted water (depression-angle colour + drifting crest/glint marks); colours come from LOOK[light].water every frame */
export const waterMaterial = () => {
  if (waterM) return waterM;
  const wn = waterNear(), wf = waterFar();
  for (const t of [wn, wf]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; }
  WATER_U.wNearTex.value = wn; WATER_U.wFarTex.value = wf;
  waterM = new THREE.MeshLambertMaterial({ color: 0xffffff });
  waterM.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, WATER_U);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>
varying vec3 vWP; uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade; uniform sampler2D wNearTex, wFarTex; uniform float wTime; uniform vec2 wFlow;`)
      .replace("#include <map_fragment>", `
  vec3 wV = vWP - cameraPosition; float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0)); float wf = 1.0 - smoothstep(0.0, 0.42, wDep);
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + wFlow * wTime;
  vec4 mk = mix(texture2D(wNearTex, wp / 6.0), texture2D(wFarTex, wp / 30.0 + 0.37), smoothstep(20.0, 80.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6); wc = mix(wc, wCrest, mk.r * 0.75); wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`)
      .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
      .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n  reflectedLight.directDiffuse = diffuseColor.rgb * mix(wShade, vec3(1.0), sunVis) + reflectedLight.directDiffuse * 0.15;\n  reflectedLight.indirectDiffuse = vec3(0.0);");
  };
  waterM.customProgramCacheKey = () => "water2";
  return waterM;
};
export const waterPlane = (parent: THREE.Object3D, x0: number, x1: number, z0: number, z1: number, y = 0) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2), waterMaterial());
  m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.receiveShadow = true; parent.add(m); return m;
};

// ---------------- the brig (Boston, Martinique, sea, voyage cutaway, Calcutta) ----------------
export type Ship = { shrouds: [THREE.Mesh[], THREE.Mesh[]]; g: THREE.Group; hatch: THREE.Group; flag: THREE.Mesh; deckY: number; L: number; W: number; pose: (t: number, roll?: number) => void };
const hullTex = (col: string) => ctex("hull" + col, 1024, 512, (g, r) => {
  const n = 12;
  for (let i = 0; i < n; i++) { g.fillStyle = col; g.fillRect(0, i * 512 / n, 1024, 512 / n); g.fillStyle = `rgba(255,255,255,${0.03 + r() * 0.05})`; g.fillRect(0, i * 512 / n, 1024, 512 / n); g.fillStyle = "rgba(15,8,6,0.7)"; g.fillRect(0, i * 512 / n, 1024, 3); }
  for (let i = 0; i < 500; i++) { g.fillStyle = "rgba(20,10,6,0.25)"; g.fillRect(r() * 1024, r() * 512, 20 + r() * 80, 1); }
  for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(240,236,220,0.5)"; g.beginPath(); g.arc(r() * 1024, 470 + r() * 40, 2 + r() * 4, 0, 7); g.fill(); } // salt crust at the waterline
  for (let i = 0; i < 12; i++) { const y0 = (i * 512) / 12, hh = 512 / 12; let x = (i % 3) * 60;
    while (x < 1024) { g.fillStyle = "rgba(12,6,4,0.55)"; g.fillRect(x, y0, 3, hh); x += 180 + r() * 80; }                          // butt joints
    for (let xx = 8; xx < 1024; xx += 32) for (const yy of [y0 + 7, y0 + hh - 9]) {                                                   // rivet heads
      g.fillStyle = "rgba(10,6,4,0.55)"; g.beginPath(); g.arc(xx + 1, yy + 1, 2.6, 0, 7); g.fill();
      g.fillStyle = "rgba(255,245,225,0.28)"; g.beginPath(); g.arc(xx - 0.6, yy - 0.6, 1.6, 0, 7); g.fill(); } }
});
export const brig = (parent: THREE.Object3D, name = "FAVORITE", o: { hull?: string; trim?: string; sails?: "set" | "furled" | "none"; cutaway?: boolean; flag?: "us" | "red" } = {}): Ship => {
  const shrouds: [THREE.Mesh[], THREE.Mesh[]] = [[], []]; // [-z side, +z side] so a set can hide the ropes in front of the action
  const g = new THREE.Group(); parent.add(g);
  const L = 11, W = 3.2, H = 2.0, hullCol = o.hull ?? "#4a3226", trim = o.trim ?? "#d4a72c";
  const shape = new THREE.Shape(); shape.moveTo(-L / 2, H * 0.55); shape.lineTo(L / 2 - 0.4, H * 0.62); shape.quadraticCurveTo(L / 2 + 0.6, H * 0.7, L / 2 + 1.0, H * 1.0);
  shape.quadraticCurveTo(L / 2 - 0.2, -H * 0.3, L / 2 - 1.8, -H * 0.45); shape.lineTo(-L / 2 + 0.7, -H * 0.45); shape.quadraticCurveTo(-L / 2 - 0.15, -H * 0.2, -L / 2, H * 0.55);
  const hm = lam("hull" + hullCol, () => ({ map: hullTex(hullCol) }));
  const depth = o.cutaway ? W / 2 : W;
  const ex = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.25, bevelSegments: 3 });
  ex.translate(0, 0, -W / 2);
  const uv = ex.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 6, uv.getY(i) / 3);
  const hull = new THREE.Mesh(ex, hm); hull.castShadow = hull.receiveShadow = true; g.add(hull);
  if (o.cutaway) { const face = new THREE.Mesh(new THREE.ShapeGeometry(shape), lam("cutFace", () => ({ color: "#e9d2a6" }))); face.position.z = 0.012; g.add(face); }
  const trimM = lam("trim" + trim, () => ({ color: trim }));
  const band = new THREE.Mesh(new THREE.BoxGeometry(L + 0.8, 0.14, (o.cutaway ? W / 2 : W) + 0.55), trimM); band.position.set(0.3, H * 0.4, o.cutaway ? -W / 4 : 0); g.add(band);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(L + 0.4, 0.3, (o.cutaway ? W / 2 : W) + 0.52), lam("stripeBlack", () => ({ color: "#2a2633" }))); stripe.position.set(0.2, H * 0.1, o.cutaway ? -W / 4 : 0); g.add(stripe);
  const deckY = H * 0.62;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(L - 0.4, 0.12, o.cutaway ? W / 2 : W + 0.1), lam("shipDeck", () => ({ map: planksHD() })));
  deck.position.set(0.1, deckY, o.cutaway ? -W / 4 : 0); deck.receiveShadow = true; g.add(deck);
  const rail = lam("rail", () => ({ map: beamHD() }));
  const zs = o.cutaway ? [-W / 2 - 0.05] : [-W / 2 - 0.05, W / 2 + 0.05];
  for (const z of zs) { for (let i = -5; i <= 5; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.55, 0.09), rail); p.position.set(i * 1.0, deckY + 0.3, z); p.castShadow = true; g.add(p); } const tr = new THREE.Mesh(new THREE.BoxGeometry(L, 0.09, 0.12), rail); tr.position.set(0, deckY + 0.58, z); g.add(tr); }
  // stern cabin with lit windows
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, o.cutaway ? W * 0.4 : W * 0.8), lam("cabinWood", () => ({ map: beamHD() }))); cab.position.set(-L / 2 + 1.5, deckY + 0.55, o.cutaway ? -W / 4 : 0); cab.castShadow = true; g.add(cab);
  for (const dx of [-0.5, 0.4]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.28), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffcf7a").multiplyScalar(1.6) })); w.position.set(-L / 2 + 1.5 + dx, deckY + 0.62, o.cutaway ? -0.01 : W * 0.4 + 0.01); w.layers.set(NOINK); g.add(w); }
  // hatch with a hinged lid
  const hatch = new THREE.Group(); hatch.position.set(1.4, deckY + 0.06, o.cutaway ? -W / 4 : 0); g.add(hatch);
  const coam = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 1.4), lam("coaming", () => ({ color: "#5a3a24" }))); coam.position.y = 0.06; hatch.add(coam);
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.15).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#2a1c22" })); hole.position.y = 0.145; hatch.add(hole);
  const lidG = new THREE.Group(); lidG.position.set(-0.7, 0.16, 0); hatch.add(lidG);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 1.25), lam("lid", () => ({ map: planksHD() }))); lid.position.x = 0.7; lid.castShadow = true; lidG.add(lid);
  hatch.userData.lid = lidG;
  // masts, yards, sails, rigging
  const mast = lam("mast", () => ({ color: "#7a5434" })), sailM = twoTone(new THREE.MeshLambertMaterial({ color: "#f6eedb", side: THREE.DoubleSide }));
  const rope = lam("rigging", () => ({ color: "#4a3626" }));
  const mz = o.cutaway ? -W / 4 : 0;
  for (const mx of [-1.6, 2.4]) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 9, 8), mast); m.position.set(mx, deckY + 4.5, mz); m.castShadow = true; g.add(m);
    for (const [yy, ww] of [[3.0, 4.0], [5.4, 3.3], [7.4, 2.4]]) {
      const yd = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, ww, 6), mast); yd.rotation.x = Math.PI / 2; yd.position.set(mx, deckY + yy, mz); g.add(yd);
      if (o.sails !== "none") {
        const furled = o.sails === "furled";
        const sg = new THREE.PlaneGeometry(ww * 0.94, furled ? 0.25 : 1.9, 10, 4); const p = sg.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, (furled ? 0.12 : 0.45) * Math.cos((x / ww) * Math.PI) * (0.65 - y / 3)); }
        sg.computeVertexNormals();
        const s = new THREE.Mesh(sg, sailM); s.rotation.y = Math.PI / 2; s.position.set(mx + 0.15, deckY + yy - (furled ? 0.18 : 1.0), mz); s.castShadow = true; g.add(s);
      }
    }
    for (const side of o.cutaway ? [-1] : [-1, 1]) { const L3 = shrouds[side > 0 ? 1 : 0]; L3.push(rod(g, [mx, deckY + 8.5, mz], [mx - 1.0, deckY + 0.55, side * W / 2], 0.015, rope), rod(g, [mx, deckY + 6.2, mz], [mx + 0.9, deckY + 0.55, side * W / 2], 0.015, rope), rod(g, [mx, deckY + 4.0, mz], [mx - 0.2, deckY + 0.55, side * W / 2], 0.015, rope)); }
  }
  rod(g, [-1.6, deckY + 8.6, mz], [2.4, deckY + 8.6, mz], 0.015, rope); rod(g, [2.4, deckY + 8.6, mz], [L / 2 + 2.6, H * 1.25, mz], 0.015, rope);
  const bs = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 3.4, 6), mast); bs.rotation.z = Math.PI / 2 - 0.35; bs.position.set(L / 2 + 1.7, H * 1.15, mz); g.add(bs);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.65, 10, 2), twoTone(new THREE.MeshLambertMaterial({ map: o.flag === "red" ? redEnsign() : flagStripes(), side: THREE.DoubleSide })));
  flag.geometry.translate(0.55, 0, 0); flag.position.set(-L / 2 + 0.2, deckY + 2.4, mz); g.add(flag);
  rod(g, [-L / 2 + 0.2, deckY + 0.5, mz], [-L / 2 + 0.2, deckY + 2.8, mz], 0.03, mast);
  // name board on the stern quarter (stencil, unlit so it reads)
  if (name) { const nb = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.4), new THREE.MeshBasicMaterial({ map: stencilTex(name, "#f3d36b", null, 768, 134), transparent: true })); nb.position.set(-L / 2 + 1.0, H * 0.25, (o.cutaway ? 0 : W / 2) + 0.31); g.add(nb); }
  const stern = lamp(g, [-L / 2 + 0.25, deckY + 1.3, mz + (o.cutaway ? -0.3 : W / 2 - 0.2)], "#ffc46b", 3, 6, "hang");
  const ship: Ship = { shrouds, g, hatch, flag, deckY, L, W, pose: (t, roll = 0) => {
    flicker(stern, t);
    const p = flag.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, 0.12 * (x / 1.1) * Math.sin(t * 5 - x * 4)); }
    p.needsUpdate = true; g.rotation.x = roll;
  } };
  return ship;
};
/** British merchant "red ensign" (red field, union canton) for 19th-century British ships */
const redEnsign = () => ctex("flagRed", 256, 160, (g) => {
  g.fillStyle = "#b8282c"; g.fillRect(0, 0, 256, 160);
  const W = 128, H = 80; g.save(); g.beginPath(); g.rect(0, 0, W, H); g.clip();
  g.fillStyle = "#23336e"; g.fillRect(0, 0, W, H);
  const diag = (w: number, c: string) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, H); g.moveTo(W, 0); g.lineTo(0, H); g.stroke(); };
  diag(16, "#f4f0e6"); diag(6, "#b8282c");
  g.fillStyle = "#f4f0e6"; g.fillRect(W / 2 - 13, 0, 26, H); g.fillRect(0, H / 2 - 13, W, 26);
  g.fillStyle = "#b8282c"; g.fillRect(W / 2 - 8, 0, 16, H); g.fillRect(0, H / 2 - 8, W, 16);
  g.restore();
});
const flagStripes = () => ctex("flag15", 256, 160, (g) => {
  for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? "#f4f0e6" : "#c0353a"; g.fillRect(0, (i * 160) / 13, 256, 160 / 13 + 1); }
  g.fillStyle = "#2c3f7a"; g.fillRect(0, 0, 108, 86); g.fillStyle = "#f4f0e6"; for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { g.beginPath(); g.arc(12 + c * 21, 14 + r * 28, 4, 0, 7); g.fill(); }
});
