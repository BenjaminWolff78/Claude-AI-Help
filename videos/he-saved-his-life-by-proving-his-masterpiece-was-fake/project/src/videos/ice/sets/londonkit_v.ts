// London kit, vehicles and boats: the red double-decker bus (with seats), the parked black cab, a steam tug with a
// smoke stack, a lighter (dumb barge) and the moored crane barge with a slewing derrick, hook and crate.
// Every key is prefixed "lon". Vehicles face +x before yaw, wheels on y = 0.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex, beamHD, planksHD } from "../paint";
import { glow, mist, stencilTex } from "../setkit";
import { NOINK } from "../ink";
import { fitText } from "./portkit_common";
import type { V3 } from "./types";

const TAU = Math.PI * 2;
const mesh = (parent: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, cast = true) => { const me = new THREE.Mesh(geo, m); me.castShadow = cast; me.receiveShadow = true; parent.add(me); return me; };
const unlit = (key: string, col: string, k = 1) => { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), toneMapped: true }); m.name = key; return m; };
const M = {
  red: () => lam("lonBusRed", () => ({ color: "#c92f2a" })),
  redDark: () => lam("lonBusRedDk", () => ({ color: "#8e1f1f" })),
  cream: () => lam("lonCream", () => ({ color: "#efe3c4" })),
  tyre: () => lam("lonTyre", () => ({ color: "#262430" })),
  hub: () => lam("lonHub", () => ({ color: "#9aa0a8" })),
  chrome: () => lam("lonChrome", () => ({ color: "#c8ccd4" })),
  black: () => lam("lonCabBlack", () => ({ color: "#26252e" })),
  seat: () => lam("lonSeat", () => ({ color: "#7a2b33" })),
  seatTop: () => lam("lonSeatTop", () => ({ color: "#a63a40" })),
  pole: () => lam("lonPole", () => ({ color: "#e8c24a" })),
  floor: () => lam("lonBusFloor", () => ({ map: planksHD(), color: "#8a7a6a" })),
  wood: () => lam("lonWood", () => ({ map: beamHD() })),
  iron: () => lam("lonIronV", () => ({ color: "#33363e" })),
  rust: () => lam("lonRust", () => ({ color: "#7a4a32" })),
  hull: () => lam("lonHull", () => ({ color: "#2d3340" })),
};
const glassM = () => { const m = new THREE.MeshLambertMaterial({ color: "#2a3560", transparent: true, opacity: 0.45, depthWrite: false }); return m; };
const wheel = (parent: THREE.Object3D, x: number, z: number, r: number, w: number) => {
  mesh(parent, new THREE.CylinderGeometry(r, r, w, 18).rotateX(Math.PI / 2).translate(x, r, z), M.tyre());
  mesh(parent, new THREE.CylinderGeometry(r * 0.55, r * 0.55, w + 0.02, 12).rotateX(Math.PI / 2).translate(x, r, z), M.hub());
  mesh(parent, new THREE.CylinderGeometry(r * 0.18, r * 0.18, w + 0.05, 8).rotateX(Math.PI / 2).translate(x, r, z), M.chrome());
};

// ---------------- the double-decker ----------------
const busBlindTex = () => ctex("lonBusBlind", 512, 96, (g) => {
  g.fillStyle = "#141420"; g.fillRect(0, 0, 512, 96);
  g.fillStyle = "#fff4d8"; g.textAlign = "left"; g.textBaseline = "middle"; fitText(g, "47", 14, 50, 90, 70, "900 %spx 'DejaVu Sans', Arial, sans-serif");
  g.textAlign = "center"; fitText(g, "RIVERSIDE  ·  CITY", 300, 50, 380, 50, "800 %spx 'DejaVu Sans Condensed', 'DejaVu Sans', Arial, sans-serif");
});
const busAdTex = () => ctex("lonBusAd", 1024, 128, (g) => {
  g.fillStyle = "#f4ecd6"; g.fillRect(0, 0, 1024, 128); g.fillStyle = "#1f3f7a"; g.fillRect(0, 0, 1024, 12); g.fillRect(0, 116, 1024, 12);
  g.fillStyle = "#1f3f7a"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "DRINK BRIGHTWELL'S TEA", 512, 66, 960, 80, "900 %spx Georgia, serif");
});
export type Bus = { g: THREE.Group; L: number };
/** red double-decker, 8.4 x 2.5 x 4.4 m, front at +x, with open windows, lit interior and rows of seats */
export const bus = (parent: THREE.Object3D): Bus => {
  const g = new THREE.Group(); parent.add(g);
  const L = 8.4, Wd = 2.5, hw = Wd / 2, x0 = -L / 2, x1 = L / 2;
  const b = new Batch(), red = M.red(), cream = M.cream(), dk = M.redDark();
  const P = (min: THREE.Vector3, max: THREE.Vector3, m: THREE.Material) => b.add(boxGeo(min, max), m);
  // decks: lower windows y 1.25-2.05, upper 2.85-3.7; pillars every 1.2 m
  const decks = [{ y0: 0.42, wy0: 1.22, wy1: 2.05, y1: 2.3 }, { y0: 2.48, wy0: 2.86, wy1: 3.7, y1: 4.0 }];
  for (const d of decks) {
    for (const s of [-1, 1]) {
      const z0 = s * hw - 0.04, z1 = s * hw + 0.04, zl = Math.min(z0, z1), zh = Math.max(z0, z1);
      P(V(x0 + 0.3, d.y0, zl), V(x1 - 0.3, d.wy0, zh), red); // skirt / waist panel
      P(V(x0 + 0.3, d.wy1, zl), V(x1 - 0.3, d.y1, zh), red); // header
      for (let x = x0 + 0.3; x <= x1 - 0.29; x += 1.2) P(V(x - 0.07, d.wy0, zl), V(x + 0.07, d.wy1, zh), red);
    }
  }
  // cream band between decks + roof
  P(V(x0 + 0.25, 2.3, -hw - 0.06), V(x1 - 0.25, 2.48, hw + 0.06), cream);
  mesh(g, new RoundedBoxGeometry(L - 0.5, 0.5, Wd, 3, 0.22).translate(0, 4.08, 0), red);
  mesh(g, new RoundedBoxGeometry(L - 0.4, 0.25, Wd + 0.04, 2, 0.08).translate(0, 0.42, 0), dk);
  // front: radiator, rounded upper front with windows, driver cab, destination blind
  P(V(x1 - 0.32, 0.42, -hw + 0.04), V(x1 - 0.2, 1.2, hw - 0.04), red);
  P(V(x1 - 0.32, 2.05, -hw + 0.04), V(x1 - 0.2, 2.3, hw - 0.04), red);
  P(V(x1 - 0.32, 2.48, -hw + 0.04), V(x1 - 0.2, 2.86, hw - 0.04), red);
  P(V(x1 - 0.32, 3.7, -hw + 0.04), V(x1 - 0.2, 4.0, hw - 0.04), red);
  P(V(x1 - 0.32, 1.2, -0.06), V(x1 - 0.2, 2.05, 0.06), red);
  P(V(x1 - 0.32, 2.86, -0.06), V(x1 - 0.2, 3.7, 0.06), red);
  P(V(x1 - 0.2, 0.45, -0.7), V(x1 - 0.05, 1.15, 0.7), M.chrome()); // radiator grille
  P(V(x1 - 0.18, 0.62, -0.62), V(x1 - 0.04, 1.08, 0.62), lam("lonGrille", () => ({ color: "#5a5e68" })));
  // back
  P(V(x0 + 0.2, 0.42, -hw + 0.04), V(x0 + 0.32, 4.0, hw - 0.04), red);
  // floors (inside) + stairs block
  P(V(x0 + 0.35, 0.62, -hw + 0.05), V(x1 - 0.35, 0.66, hw - 0.05), M.floor());
  P(V(x0 + 0.35, 2.4, -hw + 0.05), V(x1 - 0.35, 2.46, hw - 0.05), M.floor());
  // seats: pairs both sides of the aisle facing +x, both decks
  for (const [fy, xs0, xs1] of [[0.66, x0 + 0.9, x1 - 1.4], [2.46, x0 + 0.7, x1 - 0.7]] as [number, number, number][]) {
    for (let x = xs0; x <= xs1; x += 0.8) for (const s of [-1, 1]) {
      const za = s > 0 ? 0.25 : -hw + 0.1, zb = s > 0 ? hw - 0.1 : -0.25;
      P(V(x - 0.22, fy + 0.38, za), V(x + 0.2, fy + 0.48, zb), M.seatTop());
      P(V(x - 0.3, fy + 0.4, za), V(x - 0.2, fy + 1.05, zb), M.seat());
      P(V(x - 0.18, fy, za + 0.05), V(x + 0.12, fy + 0.38, zb - 0.05), M.iron());
    }
    for (let x = xs0 + 0.4; x < xs1; x += 2.4) b.add(new THREE.CylinderGeometry(0.025, 0.025, 1.7, 6).translate(x, fy + 0.85, 0.27), M.pole());
  }
  b.build(g);
  // windows (transparent glass) + lit ceilings
  const glass = glassM();
  for (const d of decks) for (const s of [-1, 1]) mesh(g, new THREE.PlaneGeometry(L - 0.6, d.wy1 - d.wy0).rotateY(s > 0 ? 0 : Math.PI).translate(0, (d.wy0 + d.wy1) / 2, s * hw), glass, false);
  for (const [y0, y1] of [[1.2, 2.05], [2.86, 3.7]]) for (const s of [-1, 1]) mesh(g, new THREE.PlaneGeometry(1.0, y1 - y0).rotateY(Math.PI / 2).translate(x1 - 0.22, (y0 + y1) / 2, s * 0.6), glass, false);
  const ceil = unlit("lonBusCeil", "#ffe2a6", 1.35);
  for (const y of [2.27, 3.96]) mesh(g, new THREE.PlaneGeometry(L - 0.8, 0.5).rotateX(Math.PI / 2).translate(0, y, 0), ceil, false).layers.set(NOINK);
  for (const y of [1.7, 3.3]) { const gl = glow(g, [0, y, 0], "#ffd38a", 4.5, 0.35); gl.scale.set(8, 2.2, 1); }
  // destination blind, ad panels, headlights, number plate
  const blind = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.28).rotateY(Math.PI / 2), new THREE.MeshBasicMaterial({ map: busBlindTex(), color: new THREE.Color(1.25, 1.25, 1.25) }));
  blind.position.set(x1 - 0.19, 2.66, 0); g.add(blind);
  for (const s of [-1, 1]) {
    const ad = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 0.36).rotateY(s > 0 ? 0 : Math.PI), lam("lonBusAdM", () => ({ map: busAdTex() })));
    ad.position.set(-0.3, 2.62, s * (hw + 0.045)); g.add(ad);
  }
  for (const s of [-1, 1]) {
    mesh(g, new THREE.CylinderGeometry(0.13, 0.13, 0.08, 14).rotateZ(Math.PI / 2).translate(x1 - 0.06, 0.82, s * 0.92), unlit("lonHead", "#fff1c8", 1.6), false);
    glow(g, [x1 + 0.1, 0.82, s * 0.92], "#ffe9b8", 1.4, 0.8);
    mesh(g, new THREE.BoxGeometry(0.06, 0.12, 0.2).translate(x0 + 0.17, 0.9, s * 0.95), unlit("lonTail", "#ff4a3a", 1.4), false);
  }
  wheel(g, x1 - 1.55, hw - 0.18, 0.5, 0.32); wheel(g, x1 - 1.55, -hw + 0.18, 0.5, 0.32);
  wheel(g, x0 + 1.7, hw - 0.18, 0.5, 0.32); wheel(g, x0 + 1.7, -hw + 0.18, 0.5, 0.32);
  return { g, L };
};

// ---------------- black cab ----------------
const taxiSignTex = () => ctex("lonTaxiSign", 256, 64, (g) => { g.fillStyle = "#ffc24a"; g.fillRect(0, 0, 256, 64); g.fillStyle = "#2a1a10"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "TAXI", 128, 34, 200, 48, "900 %spx 'DejaVu Sans', Arial, sans-serif"); });
export const cab = (parent: THREE.Object3D) => {
  const g = new THREE.Group(); parent.add(g);
  const blk = M.black();
  mesh(g, new RoundedBoxGeometry(4.4, 0.85, 1.74, 3, 0.25).translate(0, 0.78, 0), blk);
  mesh(g, new RoundedBoxGeometry(2.5, 0.8, 1.6, 3, 0.2).translate(-0.35, 1.45, 0), blk);
  const glass = glassM();
  for (const s of [-1, 1]) mesh(g, new THREE.PlaneGeometry(2.2, 0.5).rotateY(s > 0 ? 0 : Math.PI).translate(-0.35, 1.5, s * 0.805), glass, false);
  mesh(g, new THREE.PlaneGeometry(1.4, 0.5).rotateY(Math.PI / 2).rotateZ(0).translate(0.905, 1.5, 0), glass, false);
  for (const s of [-1, 1]) { // front wings + headlights
    mesh(g, new RoundedBoxGeometry(1.0, 0.5, 0.36, 2, 0.15).translate(1.5, 0.82, s * 0.72), blk);
    mesh(g, new THREE.CylinderGeometry(0.12, 0.12, 0.08, 14).rotateZ(Math.PI / 2).translate(2.02, 0.95, s * 0.72), unlit("lonCabHead", "#fff1c8", 1.3), false);
    glow(g, [2.1, 0.95, s * 0.72], "#ffe9b8", 1.0, 0.6);
  }
  mesh(g, new THREE.BoxGeometry(0.06, 0.4, 0.7).translate(2.2, 0.75, 0), M.chrome());
  mesh(g, new THREE.BoxGeometry(0.12, 0.08, 1.8).translate(2.22, 0.42, 0), M.chrome());
  mesh(g, new THREE.BoxGeometry(0.12, 0.08, 1.8).translate(-2.22, 0.42, 0), M.chrome());
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.12), [M.black(), M.black(), M.black(), M.black(), new THREE.MeshBasicMaterial({ map: taxiSignTex(), color: new THREE.Color(1.4, 1.3, 1.1) }), new THREE.MeshBasicMaterial({ map: taxiSignTex(), color: new THREE.Color(1.4, 1.3, 1.1) })]);
  sign.rotation.y = Math.PI / 2; sign.position.set(0.5, 1.92, 0); g.add(sign); glow(g, [0.5, 1.95, 0], "#ffc24a", 0.9, 0.5);
  for (const [x, z] of [[1.4, 0.72], [1.4, -0.72], [-1.45, 0.72], [-1.45, -0.72]]) wheel(g, x, z, 0.36, 0.22);
  return g;
};

// ---------------- boats ----------------
const hullShape = (L: number, Wd: number, bowK = 0.25) => {
  const s = new THREE.Shape(), hl = L / 2, hw = Wd / 2;
  s.moveTo(-hl, -hw + 0.3); s.quadraticCurveTo(-hl, -hw, -hl + 0.6, -hw); s.lineTo(hl - L * bowK, -hw);
  s.quadraticCurveTo(hl - 0.2, -hw * 0.6, hl, 0); s.quadraticCurveTo(hl - 0.2, hw * 0.6, hl - L * bowK, hw); s.lineTo(-hl + 0.6, hw); s.quadraticCurveTo(-hl, hw, -hl, hw - 0.3); s.closePath();
  return s;
};
const hullGeo = (L: number, Wd: number, H: number, bowK = 0.25) => new THREE.ExtrudeGeometry(hullShape(L, Wd, bowK), { depth: H, bevelEnabled: false, curveSegments: 8 }).rotateX(-Math.PI / 2);
const bandTex = (key: string, top: string, mid: string, bot: string) => ctex("lonBand" + key, 64, 256, (g) => {
  g.fillStyle = bot; g.fillRect(0, 0, 64, 256); g.fillStyle = mid; g.fillRect(0, 0, 64, 150); g.fillStyle = top; g.fillRect(0, 0, 64, 26);
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(255,255,255,0.06)"; g.fillRect(0, Math.random() * 256, 64, 1); }
});
export type Tug = { g: THREE.Group; puffs: THREE.Sprite[]; funnelTop: THREE.Vector3 };
/** steam tug, 11 m, bow at +x: black hull with a red band, cream wheelhouse, tall funnel, tyre fenders, mast light */
export const tug = (parent: THREE.Object3D): Tug => {
  const g = new THREE.Group(); parent.add(g);
  const hm = lam("lonTugHull", () => ({ map: bandTex("tug", "#d8d2c0", "#262a36", "#a8322c") }));
  const hg = hullGeo(11, 3.6, 2.0, 0.3).translate(0, -1.0, 0);
  const uv = hg.attributes.uv as THREE.BufferAttribute, pos = hg.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) * 0.1, (pos.getY(i) + 1.0) / 2.0);
  mesh(g, hg, hm);
  mesh(g, new THREE.ShapeGeometry(hullShape(10.6, 3.3, 0.3)).rotateX(-Math.PI / 2).translate(0, 1.0, 0), lam("lonTugDeck", () => ({ map: planksHD(), color: "#a08a72" })));
  const cr = M.cream(), wh = new THREE.Group(); g.add(wh);
  mesh(wh, new RoundedBoxGeometry(3.4, 1.6, 2.4, 2, 0.12).translate(-0.6, 1.8, 0), cr);
  mesh(wh, new RoundedBoxGeometry(2.0, 1.3, 2.0, 2, 0.12).translate(0.2, 3.2, 0), cr);
  mesh(wh, new THREE.BoxGeometry(2.3, 0.12, 2.3).translate(0.2, 3.9, 0), lam("lonTugRoof", () => ({ color: "#5a3a2a" })));
  const win = unlit("lonTugWin", "#ffd590", 1.25);
  for (const s of [-1, 1]) for (const x of [-0.3, 0.6]) mesh(wh, new THREE.PlaneGeometry(0.5, 0.45).rotateY(s > 0 ? 0 : Math.PI).translate(x, 3.25, s * 1.01), win, false);
  mesh(wh, new THREE.PlaneGeometry(1.4, 0.45).rotateY(Math.PI / 2).translate(1.21, 3.25, 0), win, false);
  glow(g, [0.4, 3.3, 0], "#ffcf80", 2.5, 0.35);
  // funnel: black with a red band, slightly raked
  const fun = new THREE.Group(); fun.position.set(-1.9, 2.4, 0); fun.rotation.z = 0.12; g.add(fun);
  mesh(fun, new THREE.CylinderGeometry(0.45, 0.5, 3.2, 16).translate(0, 1.6, 0), M.black());
  mesh(fun, new THREE.CylinderGeometry(0.47, 0.47, 0.5, 16).translate(0, 2.4, 0), lam("lonFunRed", () => ({ color: "#c8352e" })));
  mesh(fun, new THREE.CylinderGeometry(0.5, 0.47, 0.15, 16).translate(0, 3.25, 0), M.black());
  // mast + light, fenders, towing hook
  mesh(g, new THREE.CylinderGeometry(0.06, 0.08, 4.5, 6).translate(2.2, 3.2, 0), M.wood());
  mesh(g, new THREE.SphereGeometry(0.1, 8, 6).translate(2.2, 5.4, 0), unlit("lonMastL", "#fff3d0", 1.6), false); glow(g, [2.2, 5.4, 0], "#fff0c8", 1.2, 0.8);
  for (const s of [-1, 1]) for (let x = -4; x <= 3; x += 1.4) mesh(g, new THREE.TorusGeometry(0.22, 0.09, 6, 12).translate(x, 0.55, s * 1.85), M.tyre());
  mesh(g, new THREE.TorusGeometry(0.45, 0.18, 6, 14).rotateY(Math.PI / 2).translate(5.55, 0.5, 0), M.tyre());
  const puffs: THREE.Sprite[] = [];
  const top = new THREE.Vector3(-1.9 - Math.sin(0.12) * 3.3, 2.4 + 3.3, 0);
  for (let i = 0; i < 5; i++) { const m = mist(g, [top.x, top.y, 0], 1.6, "#8f96b8", 0.6); m.userData = { p: [top.x, top.y, 0], size: 1.5, op: 0.55 }; puffs.push(m); }
  return { g, puffs, funnelTop: top };
};
/** a dumb lighter (barge) with a tarpaulin-covered cargo; bow at +x */
export const lighter = (parent: THREE.Object3D, L = 14) => {
  const g = new THREE.Group(); parent.add(g);
  const hm = lam("lonLighterHull", () => ({ map: bandTex("lighter", "#8a7a5a", "#2a2c34", "#4a3a30") }));
  const hg = new THREE.ExtrudeGeometry((() => { const s = new THREE.Shape(), hl = L / 2; s.moveTo(-hl, -2); s.lineTo(hl - 1.2, -2); s.quadraticCurveTo(hl, -1.8, hl, 0); s.quadraticCurveTo(hl, 1.8, hl - 1.2, 2); s.lineTo(-hl, 2); s.closePath(); return s; })(), { depth: 1.6, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, -0.8, 0);
  const uv = hg.attributes.uv as THREE.BufferAttribute, pos = hg.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) * 0.1, (pos.getY(i) + 0.8) / 1.6);
  mesh(g, hg, hm);
  const tarp = lam("lonTarpGreen", () => ({ map: tarpTex("#3f5e48") }));
  mesh(g, new RoundedBoxGeometry(L - 3, 1.2, 3.4, 2, 0.3).translate(-0.4, 1.0, 0), tarp);
  for (let x = -L / 2 + 2; x < L / 2 - 2; x += 1.6) mesh(g, new THREE.TorusGeometry(1.75, 0.02, 4, 24, Math.PI).rotateY(Math.PI / 2).scale(1, 0.62, 1).translate(x, 0.7, 0), M.iron(), false);
  return g;
};
export const tarpTex = (col: string) => ctex("lonTarp" + col, 512, 512, (g, r) => {
  g.fillStyle = col; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 14; i++) { const x = r() * 512, w = 20 + r() * 50; const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(0.5, `rgba(${r() < 0.5 ? "255,255,255,0.12" : "0,0,0,0.16"})`); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x, 0, w, 512); }
  g.strokeStyle = "rgba(255,255,255,0.18)"; g.lineWidth = 3; for (let y = 64; y < 512; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  for (let i = 0; i < 300; i++) { g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(r() * 512, r() * 512, 2, 2); }
});

// ---------------- the crane barge (moored by a pier; crate on the hook) ----------------
const crateTex = () => ctex("lonCrateFace", 512, 512, (g, r) => {
  g.fillStyle = "#b98a56"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6; i++) { g.fillStyle = `hsl(30, ${40 + r() * 10}%, ${44 + r() * 8}%)`; g.fillRect(0, i * 85 + 2, 512, 80); g.fillStyle = "rgba(50,28,12,0.6)"; g.fillRect(0, i * 85, 512, 4); }
  for (let i = 0; i < 160; i++) { g.fillStyle = "rgba(70,40,18,0.25)"; g.fillRect(r() * 512, r() * 512, 30 + r() * 80, 1.5); }
  g.fillStyle = "#6a4426"; g.fillRect(0, 0, 512, 34); g.fillRect(0, 478, 512, 34); g.fillRect(0, 0, 34, 512); g.fillRect(478, 0, 34, 512);
  g.save(); g.translate(256, 256); g.rotate(Math.atan2(444, 444)); g.fillRect(-330, -17, 660, 34); g.restore();
  g.fillStyle = "#2a1a10"; g.textAlign = "center"; g.textBaseline = "middle";
  fitText(g, "LONDON BRIDGE", 256, 200, 400, 54, "900 %spx 'DejaVu Sans Condensed', 'DejaVu Sans', sans-serif");
  fitText(g, "LOT 3-14  ·  GRANITE", 256, 300, 400, 44, "900 %spx 'DejaVu Sans Condensed', 'DejaVu Sans', sans-serif");
});
export type CraneBarge = { g: THREE.Group; slew: THREE.Group; hookRope: THREE.Mesh; hook: THREE.Group; crate: THREE.Group; tipLocal: THREE.Vector3; mastLocal: THREE.Vector3;
  place: (u: number, t: number, restWorld: THREE.Vector3) => void };
/** barge 12 x 5 m (bow +x) with a steam derrick: mast + boom (length 15) slewing about the mast; the hook rope and a
 *  crate. place(u, t, rest): u 0..1 lift (0-0.35, rope shortens), slew the boom 72 deg towards -x of the barge (0.35-0.75), then the
 *  crate keeps swinging; rest = the crate's resting point (crane-local) at u = 0 (aimed at by the boom). */
export const craneBarge = (parent: THREE.Object3D): CraneBarge => {
  const g = new THREE.Group(); parent.add(g);
  const hm = lam("lonCraneHull", () => ({ map: bandTex("crane", "#c9b98e", "#3a3530", "#5a3028") }));
  const hg = new THREE.ExtrudeGeometry((() => { const s = new THREE.Shape(); s.moveTo(-6, -2.5); s.lineTo(5, -2.5); s.quadraticCurveTo(6, -2.3, 6, 0); s.quadraticCurveTo(6, 2.3, 5, 2.5); s.lineTo(-6, 2.5); s.closePath(); return s; })(), { depth: 2.0, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, -0.9, 0);
  const uv = hg.attributes.uv as THREE.BufferAttribute, pos = hg.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) * 0.1, (pos.getY(i) + 0.9) / 2.0);
  mesh(g, hg, hm);
  mesh(g, new THREE.PlaneGeometry(11.6, 4.8).rotateX(-Math.PI / 2).translate(-0.2, 1.1, 0), lam("lonCraneDeck", () => ({ map: planksHD(), color: "#9a8670" })));
  // engine house with a stove pipe, coal heap, chain locker, bollards, fenders
  const b = new Batch();
  b.add(boxGeo(V(2.0, 1.1, -1.6), V(5.0, 3.2, 1.6), 1), lam("lonHouse", () => ({ map: planksHD(), color: "#6a7f86" })));
  b.add(boxGeo(V(1.8, 3.2, -1.8), V(5.2, 3.35, 1.8)), lam("lonTugRoof", () => ({ color: "#5a3a2a" })));
  b.add(new THREE.CylinderGeometry(0.18, 0.2, 2.2, 10).translate(4.2, 4.4, 0.6), M.black());
  b.add(new THREE.SphereGeometry(1.0, 10, 6, 0, TAU, 0, Math.PI / 2).scale(1.2, 0.5, 1).translate(-4.2, 1.1, 1.2), lam("lonCoal", () => ({ color: "#2b2a32" })));
  for (const [x, z] of [[-5.3, -2.0], [-5.3, 2.0], [4.8, -2.0], [4.8, 2.0]]) { b.add(new THREE.CylinderGeometry(0.16, 0.2, 0.5, 10).translate(x, 1.35, z), M.iron()); b.add(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 10).translate(x, 1.62, z), M.iron()); }
  // stone blocks already on the barge (numbered faces come from the set's stack kit)
  b.build(g);
  for (const s of [-1, 1]) for (let x = -5; x <= 4; x += 1.5) mesh(g, new THREE.TorusGeometry(0.22, 0.09, 6, 12).translate(x, 0.6, s * 2.6), M.tyre());
  const winL = unlit("lonCraneWin", "#ffd590", 1.2);
  for (const s of [-1, 1]) mesh(g, new THREE.PlaneGeometry(0.7, 0.5).rotateY(s > 0 ? 0 : Math.PI).translate(3.5, 2.4, s * 1.61), winL, false);
  // slewing derrick at x = -3.2: turntable, A-frame back stays, boom, cables
  const mastLocal = new THREE.Vector3(-3.2, 1.1, 0);
  const slew = new THREE.Group(); slew.position.copy(mastLocal); g.add(slew);
  const steel = lam("lonCraneSteel", () => ({ color: "#c46a2a" })), steelDk = lam("lonCraneSteelDk", () => ({ color: "#7a3c1c" }));
  mesh(slew, new THREE.CylinderGeometry(1.3, 1.5, 0.4, 20).translate(0, 0.2, 0), M.iron());
  mesh(slew, new THREE.BoxGeometry(2.6, 1.6, 2.0).translate(-0.9, 1.2, 0), lam("lonCraneCab", () => ({ map: planksHD(), color: "#5c7078" })));
  mesh(slew, new THREE.BoxGeometry(2.8, 0.12, 2.2).translate(-0.9, 2.05, 0), M.black());
  mesh(slew, new THREE.CylinderGeometry(0.6, 0.6, 0.9, 14).rotateX(Math.PI / 2).translate(-1.6, 1.0, 1.25), M.black()); // winch drum
  mesh(slew, new THREE.CylinderGeometry(0.12, 0.14, 1.6, 8).translate(-1.8, 2.9, -0.5), M.black());
  // the boom: a lattice of two chords with cross bars, pointing along local -z (towards rest), pivot at y 1.5
  const BL = 17, piv = new THREE.Vector3(0.3, 1.5, 0);
  const boom = new THREE.Group(); boom.position.copy(piv); slew.add(boom);
  const bb = new Batch();
  for (const sx of [-1, 1]) { bb.add(new THREE.BoxGeometry(0.16, 0.16, BL).translate(sx * 0.32, 0, -BL / 2), steel); }
  for (let k = 0; k < 16; k++) { const z = -0.5 - k * 1.03; bb.add(new THREE.BoxGeometry(0.64, 0.07, 0.07).translate(0, 0, z), steelDk); bb.add(new THREE.BoxGeometry(0.06, 0.06, 1.15).rotateY(k % 2 ? 0.5 : -0.5).translate(0, 0, z - 0.5), steelDk); }
  bb.add(new THREE.CylinderGeometry(0.22, 0.22, 0.2, 12).rotateZ(Math.PI / 2).translate(0, 0, -BL), M.iron());
  bb.build(boom);
  const BOOM_EL = 1.0; boom.rotation.x = BOOM_EL; // tilt the boom up (towards -z, up)
  const tipLocal = new THREE.Vector3(0, 0, -BL).applyEuler(new THREE.Euler(BOOM_EL, 0, 0)).add(piv);
  // stays from the cab top to the boom tip (two thin rods)
  const stayM = lam("lonCable", () => ({ color: "#2a2a30" }));
  const stays = [0, 1].map(() => mesh(slew, new THREE.CylinderGeometry(0.025, 0.025, 1, 5), stayM, false));
  const setRod = (m: THREE.Mesh, a: THREE.Vector3, c: THREE.Vector3) => { m.position.copy(a).add(c).multiplyScalar(0.5); m.scale.set(1, a.distanceTo(c), 1); m.quaternion.setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize()); };
  setRod(stays[0], V(-1.9, 2.1, 0.6), tipLocal.clone().add(V(0.25, 0, 0))); setRod(stays[1], V(-1.9, 2.1, -0.6), tipLocal.clone().add(V(-0.25, 0, 0)));
  const hookRope = mesh(g, new THREE.CylinderGeometry(0.03, 0.03, 1, 6), stayM, false);
  const hook = new THREE.Group(); g.add(hook);
  mesh(hook, new THREE.BoxGeometry(0.34, 0.5, 0.22).translate(0, -0.25, 0), lam("lonHookBlock", () => ({ color: "#e0b030" })));
  mesh(hook, new THREE.TorusGeometry(0.16, 0.05, 6, 12, Math.PI * 1.4).rotateZ(-Math.PI * 0.2).translate(0, -0.7, 0), M.iron());
  const crate = new THREE.Group(); g.add(crate);
  const cm = lam("lonCrateM", () => ({ map: crateTex() }));
  mesh(crate, new THREE.BoxGeometry(1.5, 1.1, 1.2).translate(0, -0.55, 0), cm);
  const slingL: THREE.Mesh[] = [0, 1, 2, 3].map(() => mesh(crate, new THREE.CylinderGeometry(0.018, 0.018, 1, 4), stayM, false));
  [[-0.7, -0.55], [0.7, -0.55], [-0.7, 0.55], [0.7, 0.55]].forEach(([x, z], i) => setRod(slingL[i], V(x, 0, z), V(0, 0.9, 0)));
  const lantern = glow(g, [mastLocal.x - 1.8, 3.6, 0], "#ffcf80", 1.6, 0.6);
  const work = new THREE.PointLight("#ffc070", 6, 14, 1.4); work.position.set(mastLocal.x - 1.6, 3.6, 0); g.add(work);
  void lantern;
  const tipW = new THREE.Vector3(), tmp = new THREE.Vector3();
  const place = (u: number, t: number, rest: THREE.Vector3) => {
    // aim: slew so the boom (local -z) points at rest; horizontal reach of the tip is fixed
    const dx = rest.x - mastLocal.x, dz = rest.z - mastLocal.z;
    const aim = Math.atan2(-dx, -dz); // rotation about y that turns local -z towards (dx, dz)
    const lift = Math.min(1, u / 0.35), sl = Math.max(0, Math.min(1, (u - 0.35) / 0.4)), swing = Math.max(0, Math.min(1, (u - 0.6) / 0.3));
    const e = (k: number) => k * k * (3 - 2 * k);
    const yaw = aim + 1.25 * e(sl) + swing * 0.06 * Math.sin(t * 1.1);
    slew.rotation.y = yaw; slew.updateMatrixWorld(true);
    tipW.copy(tipLocal).applyAxisAngle(V(0, 1, 0), yaw).add(mastLocal);
    const rope0 = tipW.y - (rest.y + 1.1 + 0.9), rope = rope0 + (2.0 - rope0) * e(lift);
    // pendulum: swings in the slew-tangent plane, bigger right after the slew
    const amp = (0.06 + 0.14 * swing) * (u > 0.35 ? 1 : 0), ph = Math.sin(t * 1.6) * amp, ph2 = Math.cos(t * 1.3) * amp * 0.4;
    const tang = V(Math.cos(yaw), 0, -Math.sin(yaw)), rad = V(-Math.sin(yaw), 0, -Math.cos(yaw));
    const hookP = tipW.clone().addScaledVector(V(0, -1, 0), rope * Math.cos(ph)).addScaledVector(tang, rope * Math.sin(ph)).addScaledVector(rad, rope * Math.sin(ph2));
    hookRope.position.copy(tipW).add(hookP).multiplyScalar(0.5); hookRope.scale.set(1, tipW.distanceTo(hookP), 1);
    hookRope.quaternion.setFromUnitVectors(V(0, 1, 0), tmp.copy(tipW).sub(hookP).normalize());
    hook.position.copy(hookP); hook.quaternion.copy(hookRope.quaternion);
    crate.position.copy(hookP).add(V(0, -0.9, 0).applyQuaternion(hookRope.quaternion)); crate.quaternion.copy(hookRope.quaternion).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw + 0.3));
  };
  return { g, slew, hookRope, hook, crate, tipLocal, mastLocal, place };
};
export const unlitMat = unlit;
export { stencilTex };
export type { V3 };
