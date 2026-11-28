// beerkit.ts — props for "They Banned Beer, So He Sold It as Bread Syrup" (2026-11-27, master prompt v34).
// Story objects (the syrup can, beer bottles, crocks, the copper kettle, the brewery truck, the giant loaf) are modelled
// here with real proportions; walls, floors and furniture come from Poly Haven assets in beer.ts.
import * as THREE from "three";
import { canvasTex, std, rbox, hsh, cl, TAU } from "./harborkit";
import { phMat, boxM } from "../ph";
import type { V3 } from "./types";

const SERIF = "Georgia, 'Times New Roman', serif";
const lin = (hex: string) => new THREE.Color().setStyle(hex);

// ---------------- the SYRUP CAN (title thing) ----------------
/** the can's wrap-around paper label: cream paper, red band, FOR BAKING in big letters, small print PURE MALT EXTRACT */
export const canLabelTex = (plain = false) => canvasTex(plain ? "canTin" : "canLabel", 1024, 384, (g) => {
  if (plain) { const gr = g.createLinearGradient(0, 0, 1024, 0); for (let i = 0; i <= 8; i++) gr.addColorStop(i / 8, i % 2 ? "#c9ccd0" : "#8e9298"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 384); return; }
  g.fillStyle = "#efe2bf"; g.fillRect(0, 0, 1024, 384);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(120,90,50,${0.03 + 0.04 * hsh(i)})`; g.fillRect(hsh(i + 0.3) * 1024, hsh(i + 0.7) * 384, 2 + 4 * hsh(i + 1.1), 1 + 2 * hsh(i + 2.3)); }
  g.fillStyle = "#b3261e"; g.fillRect(0, 30, 1024, 70); g.fillRect(0, 300, 1024, 46);
  g.fillStyle = "#f6ecd2"; g.font = `900 46px ${SERIF}`; g.textAlign = "center"; g.textBaseline = "middle";
  for (const x of [256, 768]) g.fillText("HOLLOW CREEK", x, 66);
  g.fillStyle = "#3a1e10"; g.font = `900 92px ${SERIF}`;
  for (const x of [256, 768]) { g.fillText("FOR", x, 150); g.fillText("BAKING", x, 238); }
  g.fillStyle = "#6a3a1a"; g.font = `700 30px ${SERIF}`;
  for (const x of [256, 768]) g.fillText("PURE MALT EXTRACT", x, 323);
  g.strokeStyle = "#3a1e10"; g.lineWidth = 4; for (const x of [256, 768]) { g.beginPath(); g.ellipse(x, 196, 210, 112, 0, 0, TAU); g.stroke(); }
});
const tinMat = () => new THREE.MeshStandardMaterial({ color: "#c7cbd0", roughness: 0.32, metalness: 0.95 });
let CAN_GEO: { body: THREE.BufferGeometry; rim: THREE.BufferGeometry; lid: THREE.BufferGeometry } | null = null;
const canGeo = () => {
  if (CAN_GEO) return CAN_GEO;
  const body = new THREE.CylinderGeometry(0.068, 0.068, 0.15, 28, 1, true); body.translate(0, 0.08, 0);
  const rim = new THREE.TorusGeometry(0.068, 0.006, 6, 28); rim.rotateX(Math.PI / 2);
  const lid = new THREE.CircleGeometry(0.066, 28); lid.rotateX(-Math.PI / 2);
  CAN_GEO = { body, rim, lid }; return CAN_GEO;
};
/** one syrup can (h 0.16, r 0.068), base at y 0; label on (labelled) or bare tin */
export const syrupCan = (labelled = true) => {
  const G = canGeo(), g = new THREE.Group(); g.name = "syrupCan";
  const body = new THREE.Mesh(G.body, labelled ? new THREE.MeshStandardMaterial({ map: canLabelTex(), roughness: 0.75 }) : tinMat()); body.castShadow = true; g.add(body);
  for (const y of [0.006, 0.156]) { const r = new THREE.Mesh(G.rim, tinMat()); r.position.y = y; g.add(r); }
  const lid = new THREE.Mesh(G.lid, tinMat()); lid.position.y = 0.158; g.add(lid);
  return g;
};
/** many labelled cans as two instanced meshes (body + lid/rim) for walls and stacks: set(i, pos, yaw) / count */
export class CanField {
  body: THREE.InstancedMesh; top: THREE.InstancedMesh; private m = new THREE.Matrix4(); private q = new THREE.Quaternion(); private s = new THREE.Vector3(1, 1, 1);
  constructor(parent: THREE.Object3D, public n: number) {
    const G = canGeo();
    this.body = new THREE.InstancedMesh(G.body, new THREE.MeshStandardMaterial({ map: canLabelTex(), roughness: 0.75 }), n);
    this.top = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.068, 0.068, 0.012, 24).translate(0, 0.156, 0), tinMat(), n);
    for (const x of [this.body, this.top]) { x.castShadow = true; x.receiveShadow = true; x.frustumCulled = false; parent.add(x); }
    this.count(0);
  }
  set(i: number, p: V3, yaw = 0) { this.q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw); this.m.compose(new THREE.Vector3(...p), this.q, this.s); this.body.setMatrixAt(i, this.m); this.top.setMatrixAt(i, this.m); }
  count(k: number) { this.body.count = this.top.count = Math.max(0, Math.min(this.n, k)); this.body.instanceMatrix.needsUpdate = this.top.instanceMatrix.needsUpdate = true; }
}

// ---------------- brown bottles + crocks ----------------
let BOT_GEO: THREE.BufferGeometry | null = null;
const botGeo = () => {
  if (BOT_GEO) return BOT_GEO;
  const p: THREE.Vector2[] = [[0, 0], [0.031, 0], [0.032, 0.004], [0.032, 0.15], [0.028, 0.17], [0.014, 0.2], [0.012, 0.235], [0.014, 0.24], [0.0001, 0.242]].map(([x, y]) => new THREE.Vector2(x, y));
  BOT_GEO = new THREE.LatheGeometry(p, 14); return BOT_GEO;
};
export const amberGlass = () => new THREE.MeshStandardMaterial({ color: "#5a2a0a", roughness: 0.12, metalness: 0.1, emissive: "#1a0800", envMapIntensity: 1.6 });
/** rows of bottles as one instanced mesh, plus caps that can fly off: pop(i, age) */
export class BottleRack {
  bot: THREE.InstancedMesh; cap: THREE.InstancedMesh; pos: V3[] = []; private m = new THREE.Matrix4();
  constructor(parent: THREE.Object3D, pts: V3[]) {
    this.pos = pts;
    this.bot = new THREE.InstancedMesh(botGeo(), amberGlass(), pts.length);
    this.cap = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.016, 0.016, 0.012, 10), new THREE.MeshStandardMaterial({ color: "#c8a23a", roughness: 0.35, metalness: 0.9 }), pts.length);
    pts.forEach((p, i) => { this.m.makeTranslation(...p); this.bot.setMatrixAt(i, this.m); });
    for (const x of [this.bot, this.cap]) { x.castShadow = true; x.receiveShadow = true; x.frustumCulled = false; parent.add(x); }
    this.caps(() => -1);
  }
  /** age(i): seconds since bottle i blew its cap (-1 = still capped). Caps arc up and out, spinning. */
  caps(age: (i: number) => number) {
    const e = new THREE.Euler(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
    this.pos.forEach((p, i) => {
      const a = age(i);
      if (a < 0) { v.set(p[0], p[1] + 0.245, p[2]); e.set(0, 0, 0); }
      else { const h = hsh(i * 3.7); v.set(p[0] + (h - 0.5) * 0.9 * a, p[1] + 0.245 + 5.2 * a - 4.9 * a * a, p[2] + (0.4 + 0.6 * hsh(i + 9.1)) * 0.7 * a); e.set(a * 23, a * 7, a * 17); if (v.y < 0.01) v.y = 0.01; }
      q.setFromEuler(e); this.m.compose(v, q, s); this.cap.setMatrixAt(i, this.m);
    });
    this.cap.instanceMatrix.needsUpdate = true;
  }
}
const crockTex = () => canvasTex("crockGlaze", 512, 256, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#5a3a22"); gr.addColorStop(0.18, "#e9dcc2"); gr.addColorStop(1, "#cbb895");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(90,70,40,${0.05 + 0.08 * hsh(i)})`; g.fillRect(hsh(i + 0.5) * 512, 40 + hsh(i + 0.9) * 216, 2, 2); }
  g.fillStyle = "#3a5aa8"; g.font = `900 56px ${SERIF}`; g.textAlign = "center"; g.fillText("5", 256, 160);
  g.strokeStyle = "#3a5aa8"; g.lineWidth = 6; g.beginPath(); g.arc(256, 140, 54, 0, TAU); g.stroke();
});
/** a 5-gallon stoneware crock (r 0.2, h 0.42) with a cloth tied over it; returns { g, foam(k) } */
export const crock = (parent: THREE.Object3D, p: V3, open = false) => {
  const g = new THREE.Group(); g.position.set(...p); parent.add(g);
  const pts = [[0.18, 0], [0.2, 0.03], [0.21, 0.2], [0.2, 0.38], [0.19, 0.41], [0.2, 0.42], [0.185, 0.43]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), new THREE.MeshStandardMaterial({ map: crockTex(), roughness: 0.35, side: THREE.DoubleSide })); body.castShadow = body.receiveShadow = true; g.add(body);
  const brew = new THREE.Mesh(new THREE.CircleGeometry(0.18, 24), new THREE.MeshStandardMaterial({ color: "#6a3a12", roughness: 0.2 })); brew.rotation.x = -Math.PI / 2; brew.position.y = 0.36; g.add(brew);
  const foam = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 10, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#f3ead6", roughness: 0.9 })); foam.position.y = 0.36; foam.scale.y = 0.01; g.add(foam);
  const cloth = new THREE.Mesh(new THREE.SphereGeometry(0.225, 20, 8, 0, TAU, 0, Math.PI / 2.4), std("#d8cfb8", 0.95)); cloth.position.y = 0.4; cloth.scale.y = 0.35; cloth.visible = !open; g.add(cloth);
  const twine = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.006, 5, 30), std("#8a6a3a", 0.9)); twine.rotation.x = Math.PI / 2; twine.position.y = 0.395; twine.visible = !open; g.add(twine);
  return { g, brew, set: (foamK: number, open2 = open, fill = 1) => { cloth.visible = twine.visible = !open2; brew.position.y = 0.06 + 0.3 * cl(fill); foam.position.y = brew.position.y; foam.scale.y = Math.max(0.01, 0.55 * foamK); foam.visible = foamK > 0.01; brew.visible = fill > 0.02; } };
};

// ---------------- the copper brew kettle ----------------
export const copper = () => new THREE.MeshStandardMaterial({ color: lin("#c87a4a"), roughness: 0.3, metalness: 1, envMapIntensity: 1.3 });
export const brassM = () => new THREE.MeshStandardMaterial({ color: lin("#c8a040"), roughness: 0.3, metalness: 0.95 });
/** a 2.5 m copper kettle on a brick plinth; returns the spout tip (world-local) */
export const kettle = (parent: THREE.Object3D, p: V3, brick: THREE.Material) => {
  const g = new THREE.Group(); g.position.set(...p); parent.add(g);
  const plinth = new THREE.Mesh(boxM(3.0, 0.7, 3.0), brick); plinth.position.y = 0.35; plinth.castShadow = plinth.receiveShadow = true; g.add(plinth);
  const cu = copper();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.2, 2.0, 48), cu); body.position.y = 1.7; body.castShadow = body.receiveShadow = true; g.add(body);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.25, 48, 16, 0, TAU, 0, Math.PI / 2), cu); dome.position.y = 2.7; dome.scale.y = 0.55; dome.castShadow = true; g.add(dome);
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 3.2, 20), cu); stack.position.y = 4.6; g.add(stack);
  const br = brassM();
  for (const y of [0.85, 1.7, 2.6]) { const band = new THREE.Mesh(new THREE.TorusGeometry(1.24, 0.03, 8, 64), br); band.rotation.x = Math.PI / 2; band.position.y = y; g.add(band); }
  for (let i = 0; i < 48; i++) { const a = (i / 48) * TAU; const rv = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), br); rv.position.set(Math.cos(a) * 1.255, 2.6, Math.sin(a) * 1.255); g.add(rv); }
  const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 24), br); hatch.rotation.z = Math.PI / 2; hatch.position.set(1.24, 2.1, 0); hatch.rotation.y = 0; g.add(hatch);
  // the spout: out of the kettle's +x side at y 1.55, along +x then down to a nozzle
  const spoutPts = [new THREE.Vector3(1.2, 1.55, 0.3), new THREE.Vector3(1.9, 1.55, 0.3), new THREE.Vector3(2.3, 1.5, 0.3), new THREE.Vector3(2.55, 1.32, 0.3)];
  const spout = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spoutPts), 20, 0.06, 10), cu); spout.castShadow = true; g.add(spout);
  const valve = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.015, 6, 16), std("#b3261e", 0.5)); valve.position.set(1.9, 1.7, 0.3); valve.rotation.x = Math.PI / 2; g.add(valve);
  const valveStem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.14, 6), br); valveStem.position.set(1.9, 1.63, 0.3); g.add(valveStem);
  const nozzle: V3 = [p[0] + 2.55, p[1] + 1.26, p[2] + 0.3];
  // the syrup stream from the nozzle into the can below (scaled each frame)
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 1, 10).translate(0, -0.5, 0), new THREE.MeshStandardMaterial({ color: "#4a2408", roughness: 0.15, emissive: "#140600" }));
  stream.position.set(2.55, 1.26, 0.3); g.add(stream);
  return { g, nozzle, stream };
};

// ---------------- a 1920s brewery truck ----------------
export const truck = (parent: THREE.Object3D, p: V3, yaw: number, chalkTex: THREE.Texture) => {
  const g = new THREE.Group(); g.position.set(...p); g.rotation.y = yaw; parent.add(g);
  const green = std("#244a32", 0.45, 0.2), black = std("#18181a", 0.5, 0.3), wood = phMat("dark_wood", 2, 1, { tint: "#a0805c" });
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; g.add(me); return me; };
  add(rbox(1.5, 0.55, 1.4, 0.08), green, 1.55, 0.95, 0);                 // hood
  add(rbox(1.0, 1.15, 1.5, 0.06), green, 0.4, 1.35, 0);                 // cab
  add(new THREE.BoxGeometry(0.06, 0.5, 1.2), black, 2.32, 0.95, 0);     // radiator
  add(new THREE.BoxGeometry(2.9, 0.12, 1.7), wood, -1.7, 0.78, 0);      // flatbed
  for (const z of [-0.85, 0.85]) add(new THREE.BoxGeometry(2.9, 0.4, 0.05), wood, -1.7, 1.02, z);
  for (const [x, z] of [[1.6, -0.75], [1.6, 0.75], [-2.4, -0.75], [-2.4, 0.75]]) { const w = add(new THREE.CylinderGeometry(0.42, 0.42, 0.18, 20), black, x, 0.42, z); w.rotation.x = Math.PI / 2; const hub = add(new THREE.CylinderGeometry(0.16, 0.16, 0.2, 12), std("#b3261e", 0.5), x, 0.42, z); hub.rotation.x = Math.PI / 2; }
  for (const x of [1.6, -2.4]) for (const z of [-1, 1]) add(new THREE.BoxGeometry(0.95, 0.06, 0.32), green, x, 0.88, z * 0.78);
  const winM = new THREE.MeshStandardMaterial({ color: "#1c2632", roughness: 0.1, metalness: 0.3 });
  add(new THREE.BoxGeometry(0.03, 0.45, 1.2), winM, 0.92, 1.62, 0);
  for (const z of [-0.76, 0.76]) add(new THREE.BoxGeometry(0.55, 0.42, 0.02), winM, 0.4, 1.6, z);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), new THREE.MeshStandardMaterial({ map: chalkTex, transparent: true, roughness: 0.9 }));
  door.name = "chalk"; (door.material as THREE.MeshStandardMaterial).opacity = 0; door.position.set(0.4, 1.12, 0.76 + 0.012); g.add(door);
  for (const z of [-0.87, 0.87]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.34), new THREE.MeshStandardMaterial({ map: canvasTex("truckSide", 1024, 136, (c) => { c.fillStyle = "#244a32"; c.fillRect(0, 0, 1024, 136); c.fillStyle = "#f2d38a"; c.font = `900 70px ${SERIF}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("HOLLOW CREEK BAKING SYRUP", 512, 70); }), roughness: 0.7 })); s.position.set(-1.7, 1.02, z * 1.03); if (z < 0) s.rotation.y = Math.PI; g.add(s); }
  return g;
};
/** a chalk-on-paint texture with the word BAKER and an arrow (alpha) */
export const chalkWordTex = () => canvasTex("chalkBaker", 512, 300, (g) => {
  g.clearRect(0, 0, 512, 300); g.strokeStyle = "rgba(245,245,235,0.92)"; g.fillStyle = "rgba(245,245,235,0.92)";
  g.font = `900 120px 'Comic Sans MS', ${SERIF}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("BAKER", 256, 120);
  g.lineWidth = 12; g.beginPath(); g.moveTo(90, 230); g.lineTo(400, 230); g.lineTo(360, 195); g.moveTo(400, 230); g.lineTo(360, 265); g.stroke();
});

// ---------------- the giant loaf (figure of speech: "a loaf the size of the church") ----------------
export const loafTex = () => canvasTex("loafCrust", 512, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#8a4a1a"); gr.addColorStop(0.5, "#c07838"); gr.addColorStop(1, "#e0a868");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${hsh(i) > 0.5 ? "250,220,170" : "70,30,10"},${0.08 + 0.1 * hsh(i + 1)})`; g.fillRect(hsh(i + 0.2) * 512, hsh(i + 0.6) * 512, 2 + 3 * hsh(i + 3), 2); }
});
export const loaf = (parent: THREE.Object3D, p: V3, L: number) => {
  const g = new THREE.Group(); g.position.set(...p); parent.add(g);
  const m = new THREE.MeshStandardMaterial({ map: loafTex(), roughness: 0.75 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), m); body.scale.set(L * 0.5, L * 0.28, L * 0.27); body.position.y = L * 0.2; body.castShadow = body.receiveShadow = true; g.add(body);
  // the scores lie ON the crust (flattened, following the dome): they stuck out as white tubes from the aerial
  for (let i = -2; i <= 2; i++) { const x = i * L * 0.15, y = L * 0.2 + L * 0.28 * Math.sqrt(Math.max(0, 1 - (x / (L * 0.5)) ** 2)) - L * 0.006; const s = new THREE.Mesh(new THREE.CapsuleGeometry(L * 0.022, L * 0.14, 4, 8), std("#e6bc80", 0.85)); s.rotation.set(Math.PI / 2, 0, 0.5); s.scale.set(1, 1, 0.3); s.position.set(x, y, 0); g.add(s); }
  return g;
};

// ---------------- foam bursts (cellar windows, bottles) ----------------
const foamTex = () => canvasTex("foamPuff", 128, 128, (g) => {
  for (let i = 0; i < 16; i++) { const x = 30 + hsh(i) * 68, y = 30 + hsh(i + 0.4) * 68, r = 14 + hsh(i + 0.9) * 22; const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r); gr.addColorStop(0, "rgba(255,252,240,1)"); gr.addColorStop(0.7, "rgba(238,226,200,0.95)"); gr.addColorStop(1, "rgba(200,180,140,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
});
/** a burst of foam puffs from a point along dir; set(age) — age < 0 hides it */
export class FoamBurst {
  sprites: THREE.Sprite[] = []; g = new THREE.Group();
  constructor(parent: THREE.Object3D, public at: V3, public dir: V3, n = 14, public size = 0.35) {
    parent.add(this.g);
    for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: foamTex(), color: "#ffffff", transparent: true, depthWrite: false })); s.visible = false; this.g.add(s); this.sprites.push(s); }
  }
  set(age: number) {
    this.sprites.forEach((s, i) => {
      const a = age - i * 0.025; s.visible = age >= 0 && a > 0 && a < 1.6;
      if (!s.visible) return;
      const h1 = hsh(i * 1.7), h2 = hsh(i * 2.9 + 1), sp = 1.6 + 2.2 * h1, k = 1 - Math.exp(-a * 3.5);
      const d = this.dir;
      s.position.set(this.at[0] + d[0] * sp * k + (h2 - 0.5) * 0.6 * k, this.at[1] + d[1] * sp * k + 0.5 * k - 0.9 * a * a * 0.4 + (h1 - 0.5) * 0.3 * k, this.at[2] + d[2] * sp * k + (hsh(i + 5) - 0.5) * 0.6 * k);
      const sc = this.size * (0.5 + 1.2 * k) * (0.7 + 0.6 * h2); s.scale.set(sc, sc, 1);
      (s.material as THREE.SpriteMaterial).opacity = cl(1.4 - a * 0.8);
    });
  }
}
