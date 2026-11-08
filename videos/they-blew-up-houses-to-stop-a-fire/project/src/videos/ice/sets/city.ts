// LONDON, 1666 ("They Blew Up Houses to Stop a Fire"): ONE long street of jettied, gable-fronted timber houses along x
// (street z -3.6..3.6, north row fronts at z = -3.6 facing +z, south row fronts at z = +3.6 facing -z), the CATHEDRAL
// closing the west end (front at x = -52), the bakery near the east end, a back lane + riverside warehouses + a stone
// quay + the river behind the south row, the bridge with houses on it to the east, back rows of roofs to the north.
// The fire comes from the east and moves west; the GAP (three house pairs at x = -4.2, 0, +4.2) is blown on day three.
//
// Controls (c):  night 0..1 lit windows + lanterns | front: x of the fire front (houses with x >= front burn; 999 none)
//   shell: x beyond which houses are burnt shells | bakery 0..1 the bakery's fire | wharf 0..1 warehouses burning
//   cath 0..1 cathedral roof on fire | lead 0..1 molten lead streams | wind 0..1 (smoke/flames lean west, flags fly)
//   hook 0..1 the hooked house (north x 16.8) topples into the street | jump 0..1 embers fly across, 1 = x 12.6 north ignites
//   b1n b1s b2n b2s b3n b3s: seconds since that gap house was blown (<0 = intact, >= 0 debris flies, rubble stays)
//   barrels 0..1 powder barrels at the gap doors | roll: metres the three street barrels have rolled (day two)
//   fuse 0..1 the burning spark along the fuse | roar 0..1 the front flames grow | die 0..1 the front flames starve
//   last 0..1 the last little flame in the rubble | splash: seconds since the mayor's bucket hit it
//   menu 0..3 the tavern board (list / taps / strike / SOLD OUT) | gaps 0..1 the gap rubble present (later shots)
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad, tri } from "../build";
import { ctex, rng, rep, cobbleHD, stoneHD, roofHD, planksHD } from "../paint";
import { glow } from "../setkit";
import { NOINK } from "../ink";
import { flameSprite, flameSet, smokeSprite, smokeSet, embers, boom, meltStream, FR, type Smoke } from "./firekit";
import type { SetBuilder, V3 } from "./types";

const TAU = Math.PI * 2;
const cl = (x: number) => Math.max(0, Math.min(1, x));
const ss = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
export const HW = 4.2, ZF = 3.6, DEP = 5.0, G0 = 2.8, GU = 2.4, JET = 0.32;
const SANS = '"DejaVu Sans", "Liberation Sans", Arial, sans-serif', SERIF = '"DejaVu Serif", "Liberation Serif", Georgia, serif';
const INKC = "#241726";
/** quad whose normal points up (roof slopes): swaps the winding when needed */
const upQuad = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, u1 = 1, v1 = 1) => {
  const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a));
  return n.y >= 0 ? quad(a, b, c, d, u1, v1) : quad(a, d, c, b, v1, u1);
};

// ---------------- painted timber-frame facades ----------------
const PLASTER = ["#efe1c0", "#ead2a4", "#f0d8c4", "#dfe0d2", "#efe6cc", "#e8c9a0"];
const TIMBER = "#4a2e20";
const PX = 120;
const timberFace = (key: string, wm: number, hm: number, v: number, kind: "ground" | "upper" | "gable" | "side", night = false) =>
  ctex(`tf_${key}_${v}_${kind}_${night ? 1 : 0}`, Math.round(wm * PX), Math.round(hm * PX), (g, r) => {
    const W = Math.round(wm * PX), H = Math.round(hm * PX), m = (x: number) => x * PX;
    g.fillStyle = PLASTER[v % PLASTER.length]; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 18; i++) { g.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.08)" : "rgba(110,80,55,0.07)"; g.beginPath(); g.ellipse(r() * W, r() * H, m(0.3 + r() * 0.6), m(0.2 + r() * 0.4), r() * 3, 0, TAU); g.fill(); }
    const beam = (x: number, y: number, w: number, h: number) => { g.fillStyle = TIMBER; g.fillRect(x, y, w, h); g.fillStyle = "rgba(255,220,180,0.16)"; g.fillRect(x + 2, y + 2, Math.max(1, w - 4), 2); g.strokeStyle = "rgba(20,10,8,0.55)"; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 2, h - 2); };
    const brace = (x0: number, y0: number, x1: number, y1: number) => { g.strokeStyle = TIMBER; g.lineWidth = m(0.13); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.strokeStyle = "rgba(20,10,8,0.45)"; g.lineWidth = 2; g.stroke(); };
    const win = (cx: number, cy: number, w: number, h: number) => {
      g.fillStyle = night ? "#ffcf7a" : "#3d4a62"; g.fillRect(cx - w / 2, cy - h / 2, w, h);
      g.strokeStyle = night ? "rgba(140,90,40,0.8)" : "rgba(170,190,215,0.6)"; g.lineWidth = 2;
      for (let d = -w; d < w + h; d += m(0.13)) { g.beginPath(); g.moveTo(cx - w / 2 + d, cy - h / 2); g.lineTo(cx - w / 2 + d - h, cy + h / 2); g.stroke(); g.beginPath(); g.moveTo(cx - w / 2 + d - h, cy - h / 2); g.lineTo(cx - w / 2 + d, cy + h / 2); g.stroke(); }
      if (!night) { g.fillStyle = "rgba(255,255,255,0.28)"; g.fillRect(cx - w / 2 + 3, cy - h / 2 + 3, w * 0.3, h * 0.35); }
      beam(cx - w / 2 - m(0.06), cy - h / 2 - m(0.08), w + m(0.12), m(0.09)); beam(cx - w / 2 - m(0.06), cy + h / 2, w + m(0.12), m(0.09));
      beam(cx - w / 2 - m(0.07), cy - h / 2, m(0.07), h); beam(cx + w / 2, cy - h / 2, m(0.07), h); beam(cx - m(0.03), cy - h / 2, m(0.06), h);
    };
    if (kind === "ground") {
      beam(0, 0, W, m(0.22)); beam(0, H - m(0.2), W, m(0.2)); beam(0, 0, m(0.18), H); beam(W - m(0.18), 0, m(0.18), H);
      const doorL = v % 2 === 0, dx = doorL ? m(0.45) : W - m(1.45);
      g.fillStyle = "#5a3424"; g.fillRect(dx, m(0.55), m(1.0), H - m(0.75)); // door
      for (let i = 1; i < 5; i++) { g.fillStyle = "rgba(20,10,6,0.45)"; g.fillRect(dx + i * m(0.2), m(0.6), 2, H - m(0.85)); }
      beam(dx - m(0.1), m(0.42), m(1.2), m(0.14)); g.fillStyle = "#c9a227"; g.beginPath(); g.arc(dx + m(0.82), H * 0.6, m(0.05), 0, TAU); g.fill();
      const sx = doorL ? m(1.9) : m(0.5); // shop window with shutters / stall board
      win(sx + m(0.9), m(1.15), m(1.6), m(0.95));
      g.fillStyle = "#6a3e28"; g.fillRect(sx, m(1.75), m(1.8), m(0.22));
      beam(doorL ? m(1.65) : W - m(1.75), 0, m(0.14), H);
    } else if (kind === "upper") {
      beam(0, 0, W, m(0.2)); beam(0, H - m(0.24), W, m(0.24)); beam(0, 0, m(0.16), H); beam(W - m(0.16), 0, m(0.16), H);
      const nw = W > m(3.6) ? 2 : 1;
      for (let i = 0; i < nw; i++) win((i + 0.5) * (W / nw), H * 0.46, m(1.05), m(0.9));
      for (let x = m(0.45); x < W - m(0.3); x += m(0.42)) { const near = [...Array(nw)].some((_, i) => Math.abs(x - (i + 0.5) * (W / nw)) < m(0.7)); if (!near) beam(x, m(0.2), m(0.1), H - m(0.44)); }
      beam(0, H * 0.82, W, m(0.1));
      brace(m(0.15), H - m(0.3), m(0.7), H * 0.82); brace(W - m(0.15), H - m(0.3), W - m(0.7), H * 0.82);
    } else if (kind === "gable") {
      beam(0, H - m(0.22), W, m(0.22)); beam(W / 2 - m(0.07), 0, m(0.14), H);
      brace(W / 2, H * 0.25, m(0.4), H - m(0.2)); brace(W / 2, H * 0.25, W - m(0.4), H - m(0.2));
      win(W / 2, H * 0.62, m(0.7), m(0.6));
      for (let x = m(0.6); x < W - m(0.4); x += m(0.55)) if (Math.abs(x - W / 2) > m(0.6)) beam(x, H * 0.55, m(0.08), H * 0.4);
    } else {
      beam(0, 0, W, m(0.18)); beam(0, H - m(0.2), W, m(0.2));
      for (let x = 0; x < W; x += m(1.4)) beam(x, 0, m(0.14), H);
      brace(m(0.2), H - m(0.2), m(1.2), m(0.2));
    }
    for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(90,60,40,0.10)"; g.fillRect(r() * W, H - m(0.25) - r() * m(0.4), m(0.3 + r() * 0.6), m(0.2)); } // splash grime
  });

// ---------------- a hanging painted sign on an iron bracket ----------------
const signTex = (key: string, draw: (g: CanvasRenderingContext2D) => void) => ctex("sg_" + key, 384, 256, (g) => {
  g.fillStyle = "#2f4a6a"; g.fillRect(0, 0, 384, 256); g.strokeStyle = "#c9a227"; g.lineWidth = 14; g.strokeRect(10, 10, 364, 236);
  g.fillStyle = "rgba(255,255,255,0.06)"; for (let y = 22; y < 240; y += 26) g.fillRect(16, y, 352, 2);
  draw(g);
});
const fitText = (g: CanvasRenderingContext2D, t: string, x: number, y: number, maxW: number, size: number, font = SANS, col = "#f4e6c0") => {
  g.textAlign = "center"; g.textBaseline = "middle"; let s = size; g.font = `900 ${s}px ${font}`;
  while (g.measureText(t).width > maxW && s > 10) { s -= 2; g.font = `900 ${s}px ${font}`; }
  g.lineWidth = Math.max(4, s * 0.12); g.strokeStyle = INKC; g.strokeText(t, x, y); g.fillStyle = col; g.fillText(t, x, y);
};

// ---------------- the tavern's chalk menu board (the labelled mechanism object) ----------------
const menuTex = (st: number) => ctex("fireMenu" + st, 512, 720, (g) => {
  g.fillStyle = "#6b4a2f"; g.fillRect(0, 0, 512, 720);
  g.fillStyle = "#26332e"; g.fillRect(28, 28, 456, 664);
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(255,255,255,0.025)"; g.beginPath(); g.ellipse(40 + Math.random() * 430, 40 + Math.random() * 640, 60, 18, Math.random() * 3, 0, TAU); g.fill(); }
  const chalk = (t: string, y: number, s: number, col = "#f4f1ea") => { g.textAlign = "center"; g.textBaseline = "middle"; g.font = `700 ${s}px ${SERIF}`; g.fillStyle = col; g.fillText(t, 256, y); };
  chalk("FIRE'S", 92, 64, "#ffd27a"); chalk("MENU", 158, 72, "#ffd27a");
  g.strokeStyle = "#f4f1ea"; g.lineWidth = 4; g.beginPath(); g.moveTo(110, 205); g.lineTo(402, 205); g.stroke();
  const items = ["TIMBER", "TAR", "THATCH", "THE NEXT", "HOUSE"];
  items.forEach((t, i) => chalk(t, 262 + i * 70 + (i >= 3 ? 10 : 0), i >= 3 ? 50 : 46));
  if (st >= 2) { g.strokeStyle = "#ff8a6a"; g.lineWidth = 12; g.lineCap = "round"; g.beginPath(); g.moveTo(96, 482); g.lineTo(420, 560); g.stroke(); g.beginPath(); g.moveTo(96, 560); g.lineTo(420, 478); g.stroke(); }
  if (st >= 3) {
    g.save(); g.translate(256, 620); g.rotate(-0.12); g.strokeStyle = "#ffd27a"; g.lineWidth = 9; g.strokeRect(-190, -52, 380, 104);
    g.font = `900 70px ${SANS}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#ffd27a"; g.fillText("SOLD OUT", 0, 4); g.restore();
  }
});

// ---------------- the set ----------------
type House = {
  i: number; x: number; side: 1 | -1; g: THREE.Group; upper: THREE.Group; mats: THREE.MeshLambertMaterial[]; baseCol: THREE.Color[];
  flames: THREE.Sprite[]; smoke: Smoke[]; wins: THREE.Mesh[]; roof: THREE.Object3D[]; top: number; door: number; blast?: Blast; rubble?: THREE.Group;
};
type Blast = { chunks: { m: THREE.Object3D; p0: THREE.Vector3; v: THREE.Vector3; w: THREE.Vector3; h: number }[]; fx: ReturnType<typeof boom> };

export const city: SetBuilder = () => {
  const root = new THREE.Group(), b = new Batch();
  // ---- ground: cobbled street, back lane, quay, packed earth under the back rows ----
  const cob = lam("ctCob", () => ({ map: rep(cobbleHD(), 34, 4), color: "#d6c7b0" }));
  b.add(boxGeo(V(-80, -0.1, -ZF - 0.2), V(70, 0, ZF + 0.2)), cob);
  const earth = lam("ctEarth", () => ({ map: rep(cobbleHD(), 30, 12), color: "#a89480" }));
  b.add(boxGeo(V(-80, -0.12, -60), V(70, -0.02, -ZF)), earth); b.add(boxGeo(V(-80, -0.12, ZF), V(70, -0.02, 12.6)), earth);
  b.add(new THREE.BoxGeometry(150, 0.06, 0.4).translate(-5, 0.0, 0), lam("ctGutter", () => ({ color: "#6a6058" })));
  const quayM = lam("ctQuay", () => ({ map: rep(stoneHD("ctQuayHD"), 30, 2), color: "#cbbfa8" }));
  b.add(boxGeo(V(-60, -1.2, 12.6), V(70, 0.05, 16.2)), quayM);
  // ---- the river ----
  const river = new THREE.Mesh(new THREE.PlaneGeometry(240, 120).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: "#3a5f8a", specular: "#ffd8a0", shininess: 60, transparent: true, opacity: 0.96 }));
  river.position.set(0, -0.9, 76); root.add(river);

  const houses: House[] = [];
  const allFlames: THREE.Sprite[] = [];
  // ---- one gable-fronted jettied timber house (front at local z = 0, extends to -DEP) ----
  const mkHouse = (i: number, x: number, side: 1 | -1, floors: number, v: number, o: { sign?: string; noUpperSplit?: boolean } = {}): House => {
    const g = new THREE.Group(); g.position.set(x, 0, side === 1 ? -ZF : ZF); g.rotation.y = side === 1 ? 0 : Math.PI; root.add(g);
    const upper = new THREE.Group(); upper.position.set(0, G0, 0); g.add(upper);
    const mats: THREE.MeshLambertMaterial[] = [];
    const M = (k: string, make: () => THREE.MeshLambertMaterialParameters) => { const m = lam(`hz${i}_${k}`, make); mats.push(m); return m; };
    const w = HW - 0.04, hw = w / 2;
    const gTex = timberFace("g", w, G0, v, "ground"), uTex = timberFace("u", w + 0.0, GU, v + 1, "upper"), sTex = timberFace("s", DEP, GU, v, "side");
    const mG = M("g", () => ({ map: gTex })), mU = M("u", () => ({ map: uTex })), mS = M("s", () => ({ map: rep(sTex, 1, 1) })), mBeam = M("bm", () => ({ color: TIMBER }));
    const roofCol = ["#8a4a3a", "#7a5a4a", "#6a5a66", "#94563e"][v % 4];
    const mR = M("r", () => ({ map: rep(roofHD(roofCol), 2, 2) }));
    const addBox = (parent: THREE.Object3D, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, front: THREE.Material, rest: THREE.Material) => {
      const geo = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      const me = new THREE.Mesh(geo, [rest, rest, rest, rest, front, rest]); me.castShadow = true; me.receiveShadow = true; parent.add(me); return me;
    };
    // ground floor + jettied upper floors (front face = +z = index 4)
    addBox(g, -hw, 0, -DEP, hw, G0, 0, mG, mS);
    let y = 0, top = G0;
    for (let f = 0; f < floors; f++) {
      const j = JET * (f + 1);
      addBox(upper, -hw - 0.05, y, -DEP, hw + 0.05, y + GU, j, mU, mS);
      addBox(upper, -hw - 0.12, y - 0.05, j - 0.08, hw + 0.12, y + 0.16, j + 0.06, mBeam, mBeam); // bressumer beam
      for (const s of [-1, 1]) addBox(upper, s * hw - 0.11, y - 0.32, j - JET - 0.04, s * hw + 0.11, y + 0.02, j - JET + 0.24, mBeam, mBeam); // jetty brackets
      y += GU; top = G0 + y;
    }
    // gable + roof (ridge along z)
    const jt = JET * floors, gh = w * 0.62, gTexG = timberFace("gb", w, gh, v, "gable");
    const mGb = M("gb", () => ({ map: gTexG, side: THREE.DoubleSide }));
    const gab = new THREE.Mesh(tri(V(-hw - 0.05, y, jt + 0.01), V(hw + 0.05, y, jt + 0.01), V(0, y + gh, jt + 0.01)), mGb);
    const ua = gab.geometry.getAttribute("uv") as THREE.BufferAttribute; ua.setXY(0, 0, 0); ua.setXY(1, 1, 0); ua.setXY(2, 0.5, 1); ua.needsUpdate = true;
    upper.add(gab);
    const back = new THREE.Mesh(tri(V(hw + 0.05, y, -DEP), V(-hw - 0.05, y, -DEP), V(0, y + gh, -DEP)), mS); upper.add(back);
    const roofs: THREE.Object3D[] = [];
    for (const s of [-1, 1]) {
      const q = upQuad(V(s * (hw + 0.38), y - 0.22, jt + 0.42), V(s * (hw + 0.38), y - 0.22, -DEP - 0.3), V(0, y + gh + 0.06, -DEP - 0.3), V(0, y + gh + 0.06, jt + 0.42), 3, 3);
      const rm = new THREE.Mesh(q, mR); rm.castShadow = true; upper.add(rm); roofs.push(rm);
    }
    addBox(upper, -0.08, y + gh - 0.02, -DEP - 0.3, 0.08, y + gh + 0.16, jt + 0.44, mBeam, mBeam); // ridge beam
    const chim = addBox(upper, hw * 0.35 * (v % 2 ? 1 : -1) - 0.35, y + gh * 0.4, -DEP * 0.7 - 0.35, hw * 0.35 * (v % 2 ? 1 : -1) + 0.35, y + gh + 1.0, -DEP * 0.7 + 0.35,
      M("ch", () => ({ map: rep(stoneHD("ctChim", ["#a8573e", "#9a4e38", "#b4644a", "#8e4632"], "#6a3a2a"), 1, 1) })), M("ch2", () => ({ color: "#8a4632" })));
    roofs.push(chim);
    top = G0 + y + gh;
    // door canopy + step
    const doorL = v % 2 === 0, dx = doorL ? -hw + 0.95 : hw - 0.95;
    addBox(g, dx - 0.65, 2.42, 0, dx + 0.65, 2.52, 0.55, mBeam, mBeam);
    addBox(g, dx - 0.6, 0, 0, dx + 0.6, 0.14, 0.4, M("st", () => ({ color: "#b8ab96" })), M("st2", () => ({ color: "#9a8e7a" })));
    // night window glows (front, upper floors)
    const wins: THREE.Mesh[] = [];
    const wm = new THREE.MeshBasicMaterial({ color: "#ffc66a", transparent: true, opacity: 0, depthWrite: false, fog: false });
    const nw = w > 3.6 ? 2 : 1;
    for (let f = 0; f < floors; f++) for (let k = 0; k < nw; k++) {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.86), wm); pl.position.set(-hw + (k + 0.5) * (w / nw), GU * f + GU * 0.54, JET * (f + 1) + 0.012); pl.layers.set(NOINK); upper.add(pl); wins.push(pl);
    }
    const shopWin = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 0.9), wm); shopWin.position.set(doorL ? -hw + 1.9 + 0.9 - 0.1 : -hw + 0.5 + 0.9, G0 - 1.15, 0.012); shopWin.layers.set(NOINK); g.add(shopWin); wins.push(shopWin);
    // hanging sign
    if (o.sign) {
      const bx = doorL ? hw - 0.3 : -hw + 0.3;
      addBox(g, bx - 0.04, 2.72, 0, bx + 0.04, 2.8, 1.25, mBeam, mBeam);
      const sp = new THREE.Group(); sp.position.set(bx, 2.72, 0.95); g.add(sp);
      const sm = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6).translate(0, -0.36, 0), new THREE.MeshLambertMaterial({ map: signTex(o.sign, (gg) => fitText(gg, o.sign!, 192, 128, 330, 92, SERIF)), side: THREE.DoubleSide }));
      sm.rotation.y = Math.PI / 2; sp.add(sm); sp.userData.swing = true; g.userData.sign = sp;
    }
    // fire: flames at windows + roof ridge + door, smoke over the roof
    const flames: THREE.Sprite[] = [];
    const fp: [number, number, number, number][] = [];
    for (let f = 0; f < floors; f++) for (let k = 0; k < nw; k++) fp.push([-hw + (k + 0.5) * (w / nw), G0 + GU * f + 0.25, JET * (f + 1) + 0.25, 1.7]);
    fp.push([0, top - gh * 0.55, jt + 0.2, 2.4], [-hw * 0.5, top - gh * 0.45, -DEP * 0.4, 2.8], [hw * 0.45, top - gh * 0.4, -DEP * 0.75, 2.6], [0, top - 0.2, -DEP * 0.55, 3.2], [dx, 0.2, 0.3, 1.5]);
    fp.forEach(([fx, fy, fz, s], k) => { const sp = flameSprite(g, [fx, fy, fz], s, i + k); flames.push(sp); allFlames.push(sp); });
    const smoke = [0, 1].map((k) => smokeSprite(g, [(k - 0.5) * 1.2, top + 0.2, -DEP * 0.5], 3.2, i + k, 9));
    const baseCol = mats.map((m) => m.color.clone());
    const H: House = { i, x, side, g, upper, mats, baseCol, flames, smoke, wins, roof: roofs, top, door: x + side * dx };
    houses.push(H); return H;
  };

  // ---- the two rows ----
  const NS: Record<string, string> = { "33.6": "BAKER", "-12.6": "THE LEAKY BUCKET", "8.4": "CANDLES", "-21": "ALE", "21": "HATS", "-29.4": "BOOKS", "4.2": "PIES" };
  const SS: Record<string, string> = { "12.6": "CLOTH", "-8.4": "SPICE", "25.2": "FISH", "-25.2": "SOAP" };
  for (let k = -10; k <= 9; k++) {
    const x = +(k * HW).toFixed(1);
    const rN = rng(k * 7 + 3), rS = rng(k * 11 + 5);
    mkHouse(houses.length, x, 1, rN() > 0.4 ? 2 : 1 + (rN() > 0.6 ? 1 : 0) || 2, (k + 20) % 6, { sign: NS[String(x)] });
    mkHouse(houses.length, x, -1, rS() > 0.35 ? 2 : 1, (k + 23) % 6, { sign: SS[String(x)] });
  }
  const hAt = (x: number, side: 1 | -1) => houses.find((h) => Math.abs(h.x - x) < 0.5 && h.side === side)!;
  // the east end closes with a row facing west; the far ends fade into back rows
  const backM = lam("ctBack", () => ({ map: rep(timberFace("bk", 4, 5, 2, "upper"), 1, 1) })), backR = lam("ctBackR", () => ({ map: rep(roofHD("#7a4a3e"), 2, 2) }));
  const backHouse = (x: number, z: number, w: number, d: number, h: number, yaw = 0) => {
    const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z), hw = w / 2, hd = d / 2, gh = w * 0.6;
    b.add(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), backM, m);
    b.add(tri(V(-hw, h, hd), V(hw, h, hd), V(0, h + gh, hd)), backM, m); b.add(tri(V(hw, h, -hd), V(-hw, h, -hd), V(0, h + gh, -hd)), backM, m);
    for (const s of [-1, 1]) b.add(upQuad(V(s * (hw + 0.3), h - 0.2, hd + 0.3), V(s * (hw + 0.3), h - 0.2, -hd - 0.3), V(0, h + gh, -hd - 0.3), V(0, h + gh, hd + 0.3), 2, 2), backR, m);
  };
  const backFlames: { s: THREE.Sprite; x: number }[] = [], backSmoke: { m: Smoke; x: number }[] = [];
  for (let row = 0; row < 3; row++) for (let k = -12; k <= 11; k++) {
    const r = rng(row * 100 + k), x = k * 4.4 + (row % 2) * 2.2, z = -11.2 - row * 7.5 + r() * 1.2, h = 5 + r() * 3;
    backHouse(x, z, 4.0, 6, h);
    if (r() > 0.45) { const s = flameSprite(root, [x, h + 1.4, z], 3.2, row * 30 + k); backFlames.push({ s, x }); allFlames.push(s); }
    if (r() > 0.6) backSmoke.push({ m: smokeSprite(root, [x, h + 2, z], 5, row + k, 16), x });
  }
  for (let k = -3; k <= 3; k++) backHouse(43.4, k * 4.4, 4.0, 6, 6.5 + (k % 2), Math.PI / 2); // east end across the street
  // ---- warehouses on the quay (behind the south row) ----
  const whM = lam("ctWh", () => ({ map: rep(planksHD(), 2, 1), color: "#b88a5a" })), whR = lam("ctWhR", () => ({ map: rep(roofHD("#6a6a72", true), 2, 2) }));
  const whFlames: THREE.Sprite[] = [], whSmoke: Smoke[] = [];
  for (let k = 0; k < 7; k++) {
    const x = 8 + k * 5.2, z = 11.1, m = new THREE.Matrix4().setPosition(x, 0, z);
    b.add(new THREE.BoxGeometry(4.8, 4.2, 3).translate(0, 2.1, 0), whM, m);
    for (const s of [-1, 1]) b.add(upQuad(V(-2.6, 4.0, s * 1.75), V(2.6, 4.0, s * 1.75), V(2.6, 5.4, 0), V(-2.6, 5.4, 0), 2, 1), whR, m);
    b.add(tri(V(-2.4, 4.2, 1.5), V(-2.4, 4.2, -1.5), V(-2.4, 5.3, 0)), whM, m); b.add(tri(V(2.4, 4.2, -1.5), V(2.4, 4.2, 1.5), V(2.4, 5.3, 0)), whM, m);
    b.add(boxGeo(V(x - 1.0, 0, z + 1.5), V(x + 1.0, 2.6, z + 1.56)), lam("ctWhDoor", () => ({ color: "#4a2e20" })));
    const sl = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.7), new THREE.MeshLambertMaterial({ map: ctex("whSign" + (k % 2), 384, 104, (g) => { g.fillStyle = "#e8dcc0"; g.fillRect(0, 0, 384, 104); fitText(g, k % 2 ? "PITCH & TAR" : "ROPE & SAIL", 192, 54, 350, 66, SANS, "#c8352e"); }) }));
    sl.position.set(x, 3.25, z + 1.58); root.add(sl);
    for (let j = 0; j < 3; j++) { const s = flameSprite(root, [x - 1.6 + j * 1.6, j === 1 ? 4.6 : 2.2, z + 1.7], j === 1 ? 3.4 : 2.4, 60 + k * 3 + j); whFlames.push(s); allFlames.push(s); }
    whSmoke.push(smokeSprite(root, [x, 5.5, z], 4.5, k, 12));
    for (let j = 0; j < 4; j++) { // tar barrels stacked on the quay
      const bx = x - 1.8 + (j % 2) * 0.75, bz = z + 2.4 + Math.floor(j / 2) * 0.7;
      b.add(new THREE.CylinderGeometry(0.32, 0.32, 0.86, 12).translate(bx, 0.43, bz), lam("ctTar", () => ({ color: "#3a2a24" })));
    }
  }
  // ---- the bridge with houses on it (east, across the river) ----
  const brM = lam("ctBridge", () => ({ map: rep(stoneHD("ctBrHD"), 6, 1), color: "#c8bca8" }));
  b.add(boxGeo(V(46, -1, 16), V(54, 1.2, 90)), brM);
  for (let k = 0; k < 10; k++) b.add(boxGeo(V(46.5, -6, 20 + k * 7), V(53.5, -0.8, 21.6 + k * 7)), brM);
  for (let k = 0; k < 9; k++) { backHouse(47.6, 21 + k * 7.6, 3.2, 3.6, 4.5 + (k % 3), Math.PI / 2); backHouse(52.4, 24 + k * 7.6, 3.2, 3.6, 4 + (k % 2), Math.PI / 2); }

  // ---- THE CATHEDRAL (front at x = -52 facing +x): nave, buttresses, big pointed window, doors, square tower, lead roof ----
  const cathM = lam("ctCath", () => ({ map: rep(stoneHD("ctCathHD", ["#ddd2bc", "#d2c6ae", "#e4d9c4", "#c9bca2"], "#a89a82"), 4, 4), color: "#e6dcc8" }));
  const leadM = new THREE.MeshPhongMaterial({ color: "#8a94a8", specular: "#e8eef8", shininess: 70 });
  b.add(boxGeo(V(-80, 0, -9), V(-52, 15, 9), 3), cathM);
  for (const s of [-1, 1]) {
    const q = new THREE.Mesh(upQuad(V(-80, 14.6, s * 9.6), V(-51.4, 14.6, s * 9.6), V(-51.4, 22, 0), V(-80, 22, 0)), leadM); q.material.side = THREE.DoubleSide; q.castShadow = true; root.add(q);
  }
  b.add(tri(V(-51.6, 15, -9), V(-51.6, 15, 9), V(-51.6, 22, 0)), cathM);
  for (const zz of [-9.6, -4.6, 4.6, 9.6]) b.add(boxGeo(V(-52.2, 0, zz - 0.5), V(-50.8, 13, zz + 0.5)), cathM); // buttresses
  b.add(boxGeo(V(-68, 0, -6), V(-58, 34, 6), 3), cathM); // central tower
  for (let k = 0; k < 8; k++) b.add(boxGeo(V(-68.4 + (k % 4) * 3.2, 34, -6.4 + Math.floor(k / 4) * 12.3), V(-67.4 + (k % 4) * 3.2, 35.6, -5.4 + Math.floor(k / 4) * 12.3)), cathM); // battlements
  const tlead = new THREE.Mesh(new THREE.ConeGeometry(8.2, 5, 4).rotateY(Math.PI / 4).translate(-63, 36.4, 0), leadM); tlead.castShadow = true; root.add(tlead);
  const cwin = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshLambertMaterial({ map: ctex("cathWin", 256, 512, (g) => {
    g.fillStyle = "#2c3a62"; g.beginPath(); g.moveTo(0, 512); g.lineTo(0, 170); g.quadraticCurveTo(0, 20, 128, 0); g.quadraticCurveTo(256, 20, 256, 170); g.lineTo(256, 512); g.fill();
    g.strokeStyle = "#e6dcc8"; g.lineWidth = 10; for (const x of [64, 128, 192]) { g.beginPath(); g.moveTo(x, 512); g.lineTo(x, 150); g.stroke(); }
    for (const y of [260, 380]) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
    g.beginPath(); g.arc(128, 120, 46, 0, TAU); g.stroke(); g.fillStyle = "rgba(255,190,90,0.35)"; g.fillRect(70, 200, 50, 60);
  }), transparent: true }));
  cwin.scale.set(5.4, 9.5, 1); cwin.position.set(-51.55, 8.6, 0); cwin.rotation.y = Math.PI / 2; root.add(cwin);
  for (const s of [-1, 1]) b.add(boxGeo(V(-51.7, 0, s * 4.2 - 0.9), V(-51.5, 3.6, s * 4.2 + 0.9)), lam("ctCathDoor", () => ({ color: "#4a2e20" })));
  b.add(boxGeo(V(-51.6, 0, -8), V(-48.5, 0.25, 8)), cathM); b.add(boxGeo(V(-51.6, 0.25, -8), V(-50, 0.5, 8)), cathM); // steps
  const gutterSpouts: V3[] = [[-51.3, 14.2, -6.8], [-51.3, 14.2, 6.8], [-51.3, 14.2, -2.2]];
  for (const s of gutterSpouts) b.add(boxGeo(V(s[0] - 0.4, s[1] - 0.25, s[2] - 0.22), V(s[0] + 0.9, s[1] + 0.25, s[2] + 0.22)), cathM);
  const cathFlames: THREE.Sprite[] = [];
  for (let k = 0; k < 11; k++) { const s = flameSprite(root, [-78 + k * 2.7, 19.5 + (k % 3) * 1.2, (k % 2 ? 1 : -1) * 2.6], 6.2, 90 + k); cathFlames.push(s); allFlames.push(s); }
  for (let k = 0; k < 4; k++) { const s = flameSprite(root, [-66 + k * 2.6, 35.5, (k % 2 ? 1 : -1) * 4], 5, 100 + k); cathFlames.push(s); allFlames.push(s); }
  const cathSmoke = [0, 1, 2, 3].map((k) => smokeSprite(root, [-72 + k * 6, 24, 0], 9, k, 22));
  const melts = gutterSpouts.map((s, k) => meltStream(root, [[s[0] + 0.85, s[1], s[2]], [s[0] + 1.2, s[1] - 2, s[2]], [s[0] + 1.25, 6, s[2] + 0.05], [s[0] + 1.3, 0.62, s[2]], [s[0] + 2.4, 0.3, s[2] * 0.85], [s[0] + 6 + k * 2.5, 0.06, s[2] * 0.4 + (k - 1) * 0.3]], 0.2 + 0.04 * k));
  const leadPuddle = new THREE.Mesh(new THREE.CircleGeometry(2.4, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#e8eef6", transparent: true, opacity: 0 }));
  leadPuddle.position.set(-45.5, 0.04, -0.6); leadPuddle.scale.set(1.6, 1, 0.6); leadPuddle.layers.set(NOINK); root.add(leadPuddle);

  // ---- props on the street ----
  const barrelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.9, 16, 4);
  { const p = barrelGeo.getAttribute("position") as THREE.BufferAttribute; for (let k = 0; k < p.count; k++) { const yy = p.getY(k), bulge = 1 + 0.14 * (1 - (yy / 0.45) ** 2); p.setX(k, p.getX(k) * bulge); p.setZ(k, p.getZ(k) * bulge); } barrelGeo.computeVertexNormals(); }
  const powderTex = ctex("powderBarrel", 512, 256, (g) => {
    const pl = planksHD(); g.fillStyle = "#9a6a3e"; g.fillRect(0, 0, 512, 256);
    for (let x = 0; x < 512; x += 42) { g.fillStyle = x % 84 ? "#a87444" : "#8e5e36"; g.fillRect(x, 0, 40, 256); g.fillStyle = "rgba(40,20,10,0.5)"; g.fillRect(x + 40, 0, 2, 256); }
    for (const y of [26, 222]) { g.fillStyle = "#4a4e58"; g.fillRect(0, y - 10, 512, 20); }
    g.fillStyle = "#e8462a"; g.fillRect(150, 92, 212, 74); g.strokeStyle = INKC; g.lineWidth = 6; g.strokeRect(150, 92, 212, 74);
    g.font = `900 46px ${SANS}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff4e0"; g.fillText("POWDER", 256, 131); void pl;
  });
  const powderM = lam("ctPowder", () => ({ map: powderTex }));
  // a narrower POWDER label (the whole word visible from one side) for the cover still (c.labelAlt)
  const powderTex2 = ctex("powderBarrel2", 512, 256, (g) => {
    g.fillStyle = "#9a6a3e"; g.fillRect(0, 0, 512, 256);
    for (let x = 0; x < 512; x += 42) { g.fillStyle = x % 84 ? "#a87444" : "#8e5e36"; g.fillRect(x, 0, 40, 256); g.fillStyle = "rgba(40,20,10,0.5)"; g.fillRect(x + 40, 0, 2, 256); }
    for (const y of [26, 222]) { g.fillStyle = "#4a4e58"; g.fillRect(0, y - 10, 512, 20); }
    g.fillStyle = "#e8462a"; g.fillRect(180, 96, 152, 66); g.strokeStyle = INKC; g.lineWidth = 6; g.strokeRect(180, 96, 152, 66);
    g.font = `900 33px ${SANS}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff4e0"; g.fillText("POWDER", 256, 131);
  });
  let labelAlt = 0;
  const warm = new THREE.PointLight("#ff7a2a", 0, 10, 1.5); root.add(warm);   // close firelight (c.wk at c.wx/wy/wz)
  const mkBarrel = (pos: V3, lying = false) => { const m = new THREE.Mesh(barrelGeo, powderM); m.castShadow = true; m.position.set(...pos); if (lying) m.rotation.z = Math.PI / 2; root.add(m); return m; };
  // three rolling barrels (day two): start at x = 2, roll east along the street to x = 10
  const rollers = [0, 1, 2].map((k) => mkBarrel([2 - k * 1.4, 0.36, 0.6 + (k - 1) * 0.9], true));
  // gap barrels (day three) at each gap house door + the fuse along the street centre line
  const gapBarrels: THREE.Mesh[] = [], northBarrels: THREE.Mesh[] = [];   // north labels face the street; c.barrelRotN turns them toward a west camera
  for (const x of [-4.2, 0, 4.2]) for (const s of [1, -1]) {   // n (north, z < 0) then s; the POWDER label turned to face the street
    const b1 = mkBarrel([x + 1.0, 0.45, -s * (ZF - 0.65)]), b2 = mkBarrel([x + 1.75, 0.45, -s * (ZF - 0.55)]);
    if (s === 1) { b1.rotation.y = Math.PI; b2.rotation.y = Math.PI * 0.92; northBarrels.push(b1, b2); } else b2.rotation.y = 0.08;
    gapBarrels.push(b1, b2);
  }
  const fuseM = new THREE.MeshLambertMaterial({ color: "#3a2a22" });
  const fusePts: V3[] = [[-11, 0.04, 0.4], [-6.5, 0.04, 0.1], [-3.2, 0.04, -2.6], [-2, 0.04, 0.2], [1.0, 0.04, -2.7], [2.2, 0.04, 0.2], [5.2, 0.04, -2.7], [5.6, 0.04, 2.7]];
  const fuseCurve = new THREE.CatmullRomCurve3(fusePts.map((p) => V(...p)));
  const fuse = new THREE.Mesh(new THREE.TubeGeometry(fuseCurve, 120, 0.03, 5, false), fuseM); root.add(fuse);
  const spark = glow(root, [0, 0.2, 0], "#ffd27a", 1.1, 1.2); spark.visible = false;
  // the hooks: a long fire-hook pole leaning into the hooked house's eaves, two ropes from its head to the pullers' hands
  const hookPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 6.6, 6).translate(0, 3.3, 0), new THREE.MeshLambertMaterial({ color: "#7a5030" }));
  hookPole.position.set(16.6, 0, 0.6); hookPole.rotation.x = -0.62; root.add(hookPole);
  const ropeM = new THREE.MeshLambertMaterial({ color: "#c9a46a" });
  const ropes = [0, 1].map(() => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 5).translate(0, 0.5, 0), ropeM); root.add(r); return r; });
  const ropeTo = (r: THREE.Mesh, a: THREE.Vector3, c: THREE.Vector3) => { const d = c.clone().sub(a); r.position.copy(a); r.scale.set(1, d.length(), 1); r.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); };
  // tavern: the chalk menu board on an A-frame stand + a wall lantern
  const menuMat = new THREE.MeshBasicMaterial({ map: menuTex(0), color: "#e8e2dc" }); // chalk stays readable at night (lit by the tavern lantern)
  const board = new THREE.Group(); board.position.set(-10.9, 0, -2.7); board.rotation.y = 0.35; root.add(board);
  const bm = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.62), menuMat); bm.position.set(0, 1.12, 0.03); bm.rotation.x = -0.12; board.add(bm);
  b.add(new THREE.BoxGeometry(1.25, 1.72, 0.06).translate(0, 1.12, 0).applyMatrix4(new THREE.Matrix4().makeRotationX(-0.12)).applyMatrix4(new THREE.Matrix4().makeRotationY(0.35).setPosition(-10.9, 0, -2.72)), lam("ctBoardFrame", () => ({ color: "#6b4a2f" })));
  b.add(new THREE.BoxGeometry(1.1, 2.0, 0.05).applyMatrix4(new THREE.Matrix4().makeRotationX(0.315)).translate(0, 0.95, -0.42).applyMatrix4(new THREE.Matrix4().makeRotationY(0.35).setPosition(-10.9, 0, -2.72)), lam("ctBoardFrame", () => ({ color: "#6b4a2f" }))); // A-frame back leg (leans back)
  const lanterns: { light: THREE.PointLight; g: THREE.Sprite; base: number }[] = [];
  const lantern = (pos: V3, base = 3) => {
    b.add(new THREE.BoxGeometry(0.06, 0.06, 0.5).translate(pos[0], pos[1] + 0.35, pos[2] - 0.2), lam("ctIron", () => ({ color: "#2e2a30" })));
    b.add(new THREE.BoxGeometry(0.26, 0.36, 0.26).translate(pos[0], pos[1], pos[2]), lam("ctLantern", () => ({ color: "#3a3234" })));
    const gm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, 0.2).translate(pos[0], pos[1], pos[2]), new THREE.MeshBasicMaterial({ color: "#ffd27a" })); gm.layers.set(NOINK); root.add(gm);
    const l = new THREE.PointLight("#ffb45a", 0, 9, 1.6); l.position.set(pos[0], pos[1] - 0.1, pos[2] + 0.2); root.add(l);
    lanterns.push({ light: l, g: glow(root, [pos[0], pos[1], pos[2] + 0.05], "#ffc06a", 1.4, 0.8), base });
  };
  lantern([-11.0, 2.6, -ZF + 0.2], 4); lantern([30.6, 2.6, -ZF + 0.2]); lantern([36.6, 2.6, -ZF + 0.2]); lantern([24, 2.6, ZF - 0.2]);
  // flags / pennants that fly in the wind (one on the tavern, one on the cathedral, one on the bakery end)
  const flags: THREE.Mesh[] = [];
  const flagTex = ctex("ctFlag", 256, 128, (g) => { g.fillStyle = "#f4f1ea"; g.fillRect(0, 0, 256, 128); g.fillStyle = "#c8352e"; g.fillRect(104, 0, 48, 128); g.fillRect(0, 40, 256, 48); });
  const flag = (pole: V3, h: number, w = 1.6) => {
    b.add(new THREE.CylinderGeometry(0.05, 0.06, h, 6).translate(pole[0], pole[1] + h / 2, pole[2]), lam("ctPole", () => ({ color: "#5a4030" })));
    const geo = new THREE.PlaneGeometry(w, w * 0.55, 12, 2).translate(-w / 2, 0, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: flagTex, side: THREE.DoubleSide })); m.position.set(pole[0], pole[1] + h - w * 0.3, pole[2]); m.userData.base = Float32Array.from((geo.getAttribute("position") as THREE.BufferAttribute).array as Float32Array); m.userData.w = w; root.add(m); flags.push(m);
  };
  flag([-9.0, 6.0, -ZF + 0.3], 3.2); flag([-63, 39, 0], 5, 3.4); flag([1.5, 7.8, ZF - 0.4], 2.6);
  // a cat on the bakery's neighbour's roof (night detail)
  const cat = new THREE.Group(); cat.position.set(29.4, 0, -ZF); root.add(cat);
  { const fur = lam("ctCat", () => ({ color: "#2e2a36" })); cat.add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8).scale(1.2, 0.9, 0.8).translate(0, 7.95, -1.0), fur)); cat.add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8).translate(0.22, 8.18, -1.0), fur)); for (const s of [-1, 1]) cat.add(new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 4).translate(0.22 + s * 0.06, 8.33, -1.0), fur)); }
  // carts, crates, buckets along the street (static)
  const wood = lam("ctWood", () => ({ map: rep(planksHD(), 1, 1), color: "#b88a5a" }));
  for (const [x, z] of [[-17, 2.4], [-30, -2.6], [27, 2.5], [-24, -2.8]] as [number, number][]) {
    b.add(boxGeo(V(x - 1.1, 0.55, z - 0.6), V(x + 1.1, 0.95, z + 0.6)), wood);
    for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 14).rotateX(Math.PI / 2).translate(x, 0.5, z + s * 0.68), lam("ctWheel", () => ({ color: "#6a4028" })));
    b.add(boxGeo(V(x + 1.1, 0.7, z - 0.05), V(x + 2.4, 0.78, z + 0.05)), wood);
  }
  for (const [x, z] of [[-14, -3.0], [-20.5, 3.0], [18.5, -3.1], [-34, 3.0], [31, 3.1]] as [number, number][]) { b.add(boxGeo(V(x - 0.35, 0, z - 0.35), V(x + 0.35, 0.7, z + 0.35)), wood); b.add(boxGeo(V(x - 0.3, 0.7, z - 0.3), V(x + 0.3, 1.2, z + 0.3)), wood); }
  // the mayor's bucket, set down in the street in front of the bakery (planted at night, still there in the morning):
  // the same wooden well bucket as his hand prop (staves, two iron bands, rope handle, water), at the prop's size
  const bucket = new THREE.Group(); root.add(bucket);
  {
    const cv = document.createElement("canvas"); cv.width = 128; cv.height = 32; const x = cv.getContext("2d")!;
    x.fillStyle = "#a8743e"; x.fillRect(0, 0, 128, 32); x.fillStyle = "#7a4f26"; for (let i = 0; i < 16; i++) x.fillRect(i * 8, 0, 1.6, 32);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping;
    bucket.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.27, 16, 1, true).translate(0, 0.135, 0), lam("ctBucketW", () => ({ map: tex, side: THREE.DoubleSide }))));
    bucket.add(new THREE.Mesh(new THREE.CircleGeometry(0.12, 16).rotateX(-Math.PI / 2).translate(0, 0.01, 0), lam("ctBucketB", () => ({ color: "#7a4f26" }))));
    const band = lam("ctBucketI", () => ({ color: "#5a5e68" }));
    for (const [y, r] of [[0.05, 0.128], [0.22, 0.146]] as [number, number][]) bucket.add(new THREE.Mesh(new THREE.CylinderGeometry(r + 0.008, r + 0.006, 0.025, 16).translate(0, y, 0), band));
    bucket.add(new THREE.Mesh(new THREE.CircleGeometry(0.142, 16).rotateX(-Math.PI / 2).translate(0, 0.23, 0), lam("ctBucketWa", () => ({ color: "#5aa0c8" }))));
    bucket.add(new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.009, 6, 16, Math.PI).translate(0, 0.27, 0), lam("ctBucketR", () => ({ color: "#c9a46a" }))));
  }
  bucket.position.set(33.5, 0, -1.94);   // under the mayor's out-held left hand
  const BAK = hAt(33.6, 1);

  // ---- rubble heaps (blown / pulled houses) ----
  const rubM = [lam("ctRub1", () => ({ color: "#5a4034" })), lam("ctRub2", () => ({ color: "#d8c8a6" })), lam("ctRub3", () => ({ color: "#3a2a26" })), lam("ctRub4", () => ({ color: "#8a4a3a" }))];
  const mkRubble = (x: number, z: number, seed: number, w = 4.2) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.visible = false; root.add(g); const r = rng(seed);
    for (let k = 0; k < 26; k++) {
      const big = k < 7, sx = big ? 1.4 + r() * 1.4 : 0.2 + r() * 1.4, sy = big ? 0.5 + r() * 0.6 : 0.12 + r() * 0.2, sz = big ? 1 + r() : 0.15 + r() * 0.3;
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), rubM[k % 4]); m.position.set((r() - 0.5) * w, sy / 2 + (big ? 0 : r() * 0.6), (r() - 0.5) * 3.4);
      m.rotation.set((r() - 0.5) * 0.6, r() * 3, (r() - 0.5) * (big ? 0.3 : 1.4)); m.castShadow = true; g.add(m);
    }
    return g;
  };
  // ---- explosion debris for a blown house: chunks spawned in the house volume, flying out toward the street and up ----
  const mkBlast = (H: House, seed: number): Blast => {
    const r = rng(seed), chunks: Blast["chunks"] = [], sgn = H.side; // local +z of the house = toward the street
    const mats = H.mats;
    for (let k = 0; k < 22; k++) {
      const big = k < 7, sx = big ? 0.6 + r() * 0.8 : 0.2 + r() * 0.6, sy = big ? 0.5 + r() * 0.6 : 0.08 + r() * 0.12, sz = big ? 0.2 + r() * 0.15 : 0.15 + r() * 0.9;
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), k % 5 === 0 ? mats[3] : k % 3 === 0 ? mats[4] : mats[k % 2 ? 1 : 0]);
      m.castShadow = true; m.visible = false; root.add(m);
      const lx = (r() - 0.5) * HW * 0.9, ly = 0.6 + r() * (H.top - 1.5), lz = -r() * DEP;
      const p0 = V(H.x + lx, ly, sgn * (-ZF + lz * -1) * -1); p0.z = sgn === 1 ? -ZF + lz : ZF - lz;
      const v = V(lx * 1.0 + (r() - 0.5) * 2, 3 + r() * 5, (sgn === 1 ? 1 : -1) * (0.4 + r() * 1.6));
      const w = V((r() - 0.5) * 9, (r() - 0.5) * 9, (r() - 0.5) * 9);
      chunks.push({ m, p0, v, w, h: sy / 2 });
    }
    const fx = boom(root, [H.x, 0.2, H.side === 1 ? -ZF + 0.3 : ZF - 0.3], 5.2); // bursts out of the front, into the street
    return { chunks, fx };
  };
  const BLOWN: Record<string, House> = {};
  for (const [key, x, s] of [["b1n", -4.2, 1], ["b1s", -4.2, -1], ["b2n", 0, 1], ["b2s", 0, -1], ["b3n", 4.2, 1], ["b3s", 4.2, -1]] as [string, number, 1 | -1][]) {
    const H = hAt(x, s); H.blast = mkBlast(H, x * 13 + s * 7 + 101); H.rubble = mkRubble(x, s === 1 ? -ZF - 2.2 : ZF + 2.2, x * 3 + s + 7); BLOWN[key] = H;
  }
  const HOOKED = hAt(16.8, 1), CATCH = hAt(12.6, 1);
  HOOKED.rubble = mkRubble(16.8, -0.4, 77, 3.4);
  const hookDust = boom(root, [16.8, 0.1, -0.6], 4.0, false);   // pulled-down floors: dust, no fireball (the powder comes later)
  const lastFlame = flameSprite(root, [5.6, 0.55, -0.6], 1.3, 7);
  const lastSteam = smokeSprite(root, [5.6, 0.6, -0.6], 1.6, 2, 3); (lastSteam.s.material as THREE.SpriteMaterial).color.set("#e8eef6");
  const em = embers(root, 420);
  const jumpEm = embers(root, 60);
  b.build(root);

  // ---- fire lights: a fixed pool (constant light count: no shader recompiles) ----
  const fireLights = [0, 1, 2, 3, 4].map(() => { const l = new THREE.PointLight("#ff8a3a", 0, 22, 1.4); root.add(l); return l; });
  const bigGlows = [0, 1, 2, 3].map(() => glow(root, [0, 0, 0], "#ff9a4a", 9, 0.5));

  // ---- marks ----
  const marks: Record<string, V3> = {
    capHook: [-6.0, 0, -0.9], hookHouse: [-4.2, 0, -ZF],
    bakerDoor: [BAK.door, 0, -ZF + 0.95], mayorIn: [37, 0, -0.4], mayorStop: [33.2, 0, -0.9], mayorOut: [38.5, 0, 0.6], bakery: [33.6, 0, -ZF],
    chain1: [20.5, 0, 13.4], chain2: [21.6, 0, 14.4], chain3: [22.8, 0, 13.6], chain4: [24.0, 0, 14.6], soup: [-47.4, 0, -3.2], soup2: [-46.2, 0, 2.6],
    capt5: [9.0, 0, 0.4], sold1: [7.6, 0, -0.6], sold2: [7.4, 0, 1.5], wife: [12.4, 0, ZF - 0.85], neighbour: [16.6, 0, ZF - 0.8], kid: [10.6, 0, 2.3], granny: [12.6, 0, -ZF],
    pull1: [14.0, 0, 0.2], pull2: [14.7, 0, -0.9], capTav: [-10.0, 0, -1.6], board: [-10.9, 0, -2.7],
    capFuse: [-11.6, 0, 0.6], soldA: [-13.2, 0, -1.2], soldB: [-13.8, 0, 1.6], crowd1: [-16.0, 0, 2.3], crowd2: [-17.2, 0, -1.0], crowd3: [-18.6, 0, 1.0], mayorEnd: [3.6, 0, 0.2], lastFlame: [5.6, 0, -0.6],
  };
  const cams = { main: { pos: [-2, 6, 18] as V3, look: [2, 3, 0] as V3, fov: 50 } };

  // ---- pose ----
  const tmp = new THREE.Vector3();
  let lastMenu = -1;
  return {
    name: "city", root, marks, cams,
    pose: (t, c) => {
      const frame = Math.round(t * 30);
      const night = cl(c.night ?? 0), front = c.front ?? 999, shell = c.shell ?? 999, wind = c.wind ?? 1;
      const roar = cl(c.roar ?? 0), die = cl(c.die ?? 0);
      // flame lean with the wind (all shared frame materials)
      allFlames[0]?.material && ((allFlames[0].material as THREE.SpriteMaterial).rotation = 0);
      for (const s of allFlames) (s.material as THREE.SpriteMaterial).rotation = 0.32 * wind;
      // houses
      const burnK = (H: House) => {
        if (H.blast && (c[`b${[-4.2, 0, 4.2].indexOf(H.x) + 1}${H.side === 1 ? "n" : "s"}`] ?? -1) >= 0) return 0;
        let k = H.x >= front ? ss((H.x - front + 1.2) / 2.4) : 0;
        if (H === CATCH) k = Math.max(k, ss(((c.jump ?? 0) - 0.82) / 0.18));
        if (Math.abs(H.x - 33.6) < 0.5 && H.side === 1) k = Math.max(k, cl(c.bakery ?? 0));
        if (H.x >= 7 && H.x < 10 && roar + die > 0) k = Math.max(0, k * (1 + 0.45 * roar) * (1 - 0.82 * die));
        return k;
      };
      for (const H of houses) {
        const isShell = H.x >= shell, k = burnK(H);
        // char the materials
        const ch = isShell ? 0.3 : 1 - 0.35 * Math.min(1, k);
        H.mats.forEach((m, j) => m.color.copy(H.baseCol[j]).multiplyScalar(ch));
        H.roof.forEach((r) => (r.visible = !isShell));
        const fk = isShell ? 0.4 : k;
        // the bakery starts small: c.bakery 0..0.5 lights only its shop-door flame, 0.5..1 the whole house
        const bakOnly = Math.abs(H.x - 33.6) < 0.5 && H.side === 1 && H.x < front && !isShell;
        H.flames.forEach((s, j) => flameSet(s, frame + j * 3, bakOnly ? (j === H.flames.length - 1 ? cl((c.bakery ?? 0) / 0.5) * 1.25 * (1 - cl(c.bakDoorOff ?? 0)) : cl(((c.bakery ?? 0) - 0.5) / 0.5)) : fk * (j >= H.flames.length - 5 ? 1.15 : 1) * (isShell && j < H.flames.length - 5 ? 0.6 : 1)));
        H.smoke.forEach((m) => smokeSet(m, t, (isShell ? 0.9 : k) * (c.smokeK ?? 1), -1.2 * wind));
        H.wins.forEach((w) => ((w.material as THREE.MeshBasicMaterial).opacity = night * 0.9));
        const sp = H.g.userData.sign as THREE.Group | undefined;
        if (sp) sp.rotation.x = (0.08 + 0.22 * wind) * Math.sin(t * (1.6 + 1.2 * wind) + H.i);
      }
      // the hooked house: upper floors topple forward into the street, then rubble
      {
        const hk = cl(c.hook ?? 0), fall = hk < 1 ? hk * hk * 1.55 : 1.55;
        HOOKED.upper.rotation.x = hk > 0 ? fall : 0; HOOKED.upper.visible = hk < 0.98;
        HOOKED.rubble!.visible = hk >= 0.9;
        hookDust.set(hk >= 0.9 ? ((c.hookAge ?? 0)) : -1);
        hookPole.visible = (c.hookPole ?? 0) > 0 && hk < 0.6;
        const pk = ss(hk / 0.6);
        hookPole.rotation.x = -0.62 + 0.25 * pk; hookPole.position.z = 0.6 + 0.8 * pk;
        const head = V(16.6, 0, 0.6 + 0.8 * pk).add(V(0, 6.6, 0).applyAxisAngle(V(1, 0, 0), -0.62 + 0.25 * pk));
        ropes.forEach((r, j) => { r.visible = hookPole.visible; ropeTo(r, head, V(j ? 14.85 : 14.15, 1.12, j ? -1.15 : -0.05)); });
      }
      // gap explosions
      for (const [key, H] of Object.entries(BLOWN)) {
        const age = c[key] ?? -1, bl = H.blast!;
        const blown = age >= 0;
        H.g.visible = !blown;
        bl.fx.set(age, c.dustFade ?? 3.0);
        for (const ch of bl.chunks) {
          ch.m.visible = blown && age < 2.4;
          if (!ch.m.visible) continue;
          const a = Math.min(age, 4);
          let y = ch.p0.y + ch.v.y * a - 4.9 * a * a;
          let tt = a;
          if (y < ch.h) { const tl = (ch.v.y + Math.sqrt(ch.v.y * ch.v.y + 19.6 * (ch.p0.y - ch.h))) / 9.8; tt = Math.min(a, tl); y = ch.h; }
          const slide = Math.max(0, a - tt) * 0.5;
          ch.m.position.set(ch.p0.x + ch.v.x * (tt + slide * 0.2), y, ch.p0.z + ch.v.z * (tt + slide * 0.2));
          ch.m.rotation.set(ch.w.x * tt, ch.w.y * tt, ch.w.z * tt);
        }
        H.rubble!.visible = blown && age > 0.35;
        if (H.rubble!.visible) H.rubble!.scale.set(1, ss((age - 0.35) / 0.6), 1);
      }
      // barrels: rolling (day two) / at the gap doors (day three)
      const roll = c.roll ?? -1;
      rollers.forEach((m, k) => { m.visible = roll >= 0; m.position.x = 2 - k * 1.4 + Math.max(0, roll); m.rotation.set(0, 0, Math.PI / 2); m.rotateY(-Math.max(0, roll) / 0.36); });
      const gb = (c.barrels ?? 0) > 0;
      const la = (c.labelAlt ?? 0) > 0 ? 1 : 0; if (la !== labelAlt) { labelAlt = la; powderM.map = la ? powderTex2 : powderTex; powderM.needsUpdate = true; }
      warm.intensity = (c.wk ?? 0) * (1 + 0.12 * Math.sin(t * 11) * Math.sin(t * 6.1)); warm.position.set(c.wx ?? 0, c.wy ?? 1.5, c.wz ?? 0);
      northBarrels.forEach((m, i) => { m.rotation.y = (c.barrelRotN ?? Math.PI) - (i % 2 ? 0.25 : 0); });
      gapBarrels.forEach((m, k) => { const key = `b${Math.floor(k / 4) + 1}${k % 4 < 2 ? "n" : "s"}`; m.visible = gb && (c[key] ?? -1) < 0; });
      fuse.visible = gb || (c.fuse ?? 0) > 0;
      const fz = c.fuse ?? 0;
      spark.visible = fz > 0 && fz < 1;
      if (spark.visible) { const p = fuseCurve.getPoint(fz); spark.position.set(p.x, 0.25, p.z); spark.scale.setScalar(0.9 + 0.4 * Math.sin(frame * 1.7)); }
      // ember jump across the hooked gap (x 21 -> 12.6, arcing over the street)
      const jp = c.jump ?? 0;
      jumpEm.set(t, (i, r) => (jp > 0.05 && jp < 1.2 ? [21 - 8.4 * cl(jp + r * 0.25 - 0.1), 6 + 3 * Math.sin(Math.PI * cl(jp + r * 0.25 - 0.1)), -ZF - 1 + r * 0.6] : null), -0.4, 1, 1.4);
      // embers riding the wind from the burning houses
      const burning = houses.filter((H) => H.x >= front && H.x < shell + 8);
      em.set(t, (i, r) => { const H = burning[(i * 7 + Math.floor(r * 50)) % Math.max(1, burning.length)]; return burning.length ? [H.x + (r - 0.5) * 3, H.top * 0.7, H.side === 1 ? -ZF - 2 : ZF + 2] : null; }, -2.6 * wind - 0.4, burning.length ? 0.85 : 0);
      // back rows, warehouses, cathedral
      for (const f of backFlames) flameSet(f.s, frame + f.x * 3, f.x >= front + 2 ? 1 : 0);
      for (const s of backSmoke) smokeSet(s.m, t, (s.x >= front ? 1 : 0) * (c.smokeK ?? 1), -1.6 * wind, 0.12);
      const wh = cl(c.wharf ?? 0);
      whFlames.forEach((s, k) => flameSet(s, frame + k * 5, wh * (k % 3 === 1 ? 1.2 : 1)));
      whSmoke.forEach((m) => smokeSet(m, t, wh, -1.4 * wind, 0.14));
      const cath = cl(c.cath ?? 0);
      cathFlames.forEach((s, k) => flameSet(s, frame + k * 4, cath));
      cathSmoke.forEach((m) => smokeSet(m, t, cath, -1.2 * wind, 0.1));
      leadM.color.set("#a4aec2").lerp(new THREE.Color("#c8a090"), cath * 0.12); leadM.emissive.set("#ff6a1a").multiplyScalar(cath * 0.08);
      tlead.material = leadM;
      const ld = cl(c.lead ?? 0);
      melts.forEach((m, k) => m.set(t + k * 0.3, ld));
      (leadPuddle.material as THREE.MeshBasicMaterial).opacity = ld * 0.85; leadPuddle.scale.set(1.6 * (0.4 + 0.6 * ld), 1, 0.6 * (0.4 + 0.6 * ld));
      // flags + lanterns
      for (const m of flags) {
        const p = m.geometry.getAttribute("position") as THREE.BufferAttribute, base = m.userData.base as Float32Array, w = m.userData.w as number;
        for (let k = 0; k < p.count; k++) { const x0 = base[k * 3], u = -x0 / w, amp = 0.05 + 0.25 * wind; p.setZ(k, amp * u * Math.sin(t * (3 + 5 * wind) + u * 5)); p.setY(k, base[k * 3 + 1] - (1 - wind) * u * u * w * 0.55); p.setX(k, x0 * (1 - (1 - wind) * 0.25)); }
        p.needsUpdate = true; m.geometry.computeVertexNormals();
      }
      for (const L of lanterns) { const f = 0.9 + 0.1 * Math.sin(t * 13 + L.base); L.light.intensity = night * L.base * f; L.g.visible = night > 0.05; }
      cat.visible = night > 0.5;
      bucket.visible = (c.bucket ?? 0) > 0; bucket.position.y = c.bucketY ?? 0;   // the mayor lets it drop
      // menu board
      const ms = Math.round(c.menu ?? 0);
      if (ms !== lastMenu) { lastMenu = ms; menuMat.map = menuTex(Math.max(0, Math.min(3, ms))); menuMat.needsUpdate = true; }
      // last little flame + the mayor's splash
      const sp = c.splash ?? -1;
      flameSet(lastFlame, frame, cl(c.last ?? 0) * (sp >= 0 ? Math.max(0, 1 - sp * 6) : 1));
      smokeSet(lastSteam, sp >= 0 ? sp * 1.5 : 0, sp >= 0 && sp < 2 ? 1 - sp / 2 : 0, 0, 0.5);
      // fire lights near the action: around the front (or the bakery / wharf / cathedral by control)
      const lx = c.lx ?? (front < 900 ? front + 3 : 33.6), lz = c.lz ?? 0, lk = c.lk ?? (front < 900 ? 1 : Math.max(cl(c.bakery ?? 0), 0));
      fireLights.forEach((l, k) => {
        l.position.set(lx + (k - 2) * 4.2, 5.5 + (k % 2), lz + (k % 2 ? -ZF - 1 : ZF + 1));
        l.intensity = lk * (16 + 4 * Math.sin(t * 9 + k * 2) * Math.sin(t * 5.3 + k)) * (1 - 0.7 * die);
      });
      bigGlows.forEach((g, k) => { g.position.set(lx + 2 + k * 5, 6, (k % 2 ? -1 : 1) * 5); g.visible = lk > 0.05; (g.material as THREE.SpriteMaterial).opacity = 0.45 * lk * (1 - 0.7 * die); });
      void tmp; void FR;
    },
  };
};
