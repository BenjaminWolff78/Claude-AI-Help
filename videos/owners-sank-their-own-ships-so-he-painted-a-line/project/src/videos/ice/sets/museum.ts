// THE MUSEUM GALLERY, Rotterdam 1937 (light `museum`): a long gallery with a glass skylight roof (the daylight you can
// see), wine-red walls hung with gilded old paintings, a marble floor, a velvet rope and a bench. THE PAINTING hangs on
// the end wall (x 0, z -4.4) under a brass picture lamp; two empty hooks either side wait for the next two fakes
// (c.hang2 / c.hang3 0..1: each is carried in from the right doorway and hung).
// Room x -4.5..4.5, z -4.5 .. 5, ceiling 5 with a skylight (x -3..3, z -3.5..4).
// ALSO "the top Nazi's hall" (set `hall`, light `hallNight`): a dark grand hall with red drapes (no emblems), a fire in a
// marble fireplace, a chandelier, a huge desk, THE PAINTING on an easel, and a cart piled with 137 real paintings that
// rolls out through the door (c.cart 0..1).
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex, rep } from "../paint";
import { glow, rod } from "../setkit";
import { beamStain, metal, motes, candle, flameFlick, TAU } from "./innerkit_b";
import { fitText } from "./portkit_common";
import { framedPainting, otherTex } from "./masterpiece";
import { NOINK } from "../ink";
import type { SetDef, SetBuilder, V3 } from "./types";

const marble = (key: string, a: string, b2: string) => ctex("mu" + key, 512, 512, (g, r) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? a : b2; g.fillRect(x * 128, y * 128, 128, 128); }
  g.strokeStyle = "rgba(120,110,100,0.35)"; g.lineWidth = 2; for (let i = 0; i < 18; i++) { let x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 60; y += (r() - 0.5) * 60; g.lineTo(x, y); } g.stroke(); }
  g.strokeStyle = "rgba(60,50,40,0.4)"; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(512, i * 128); g.stroke(); }
});
const damask = (key: string, base: string, pat: string) => ctex("muDam" + key, 512, 512, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512); g.fillStyle = pat;
  for (let y = 0; y < 512; y += 128) for (let x = 0; x < 512; x += 128) { const ox = (y / 128) % 2 ? 64 : 0; g.beginPath(); g.moveTo(x + ox + 64, y + 16); g.quadraticCurveTo(x + ox + 104, y + 64, x + ox + 64, y + 112); g.quadraticCurveTo(x + ox + 24, y + 64, x + ox + 64, y + 16); g.fill(); }
});

export const museum: SetBuilder = () => {
  const root = new THREE.Group(), b = new Batch();
  const X0 = -4.5, X1 = 4.5, Z0 = -4.5, Z1 = 9, HT = 5;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0).rotateX(-Math.PI / 2), lam("muFloor", () => ({ map: rep(marble("Floor", "#e8e0d0", "#a89a88"), 3, 3) }))); floor.position.set(0, 0, (Z0 + Z1) / 2); floor.receiveShadow = true; root.add(floor);
  const red = lam("muRed", () => ({ map: rep(damask("Red", "#8a2432", "rgba(255,190,160,0.12)"), 4, 2) })), cream = lam("muCream", () => ({ color: "#efe4c8" })), dado = lam("muDado", () => ({ map: beamStain("muDado", "#4a2414", 0.5) }));
  const gold = metal("muGold", "#e0ac44", 70), brass = metal("muBrass", "#c99a3a", 60);
  const wall = (x0: number, z0: number, x1: number, z1: number) => { b.add(boxGeo(V(x0, 0, z0), V(x1, 1.0, z1), 1), dado); b.add(boxGeo(V(x0, 1.0, z0), V(x1, HT, z1), 1), red); b.add(boxGeo(V(x0, 0.98, z0), V(x1, 1.08, z1)), cream); b.add(boxGeo(V(x0, HT - 0.35, z0), V(x1, HT, z1)), cream); };
  wall(X0, Z0 - 0.2, X1, Z0); wall(X0 - 0.2, Z0, X0, Z1); wall(X0, Z1, X1, Z1 + 0.2);
  // right wall with a doorway (x 4.5, z 1.0..2.6) the porters come through
  wall(X1, Z0, X1 + 0.2, 1.0); wall(X1, 2.6, X1 + 0.2, Z1); b.add(boxGeo(V(X1, 3.0, 1.0), V(X1 + 0.2, HT, 2.6), 1), red);
  b.add(boxGeo(V(X1 - 0.05, 0, 0.9), V(X1 + 0.25, 3.1, 1.0)), cream); b.add(boxGeo(V(X1 - 0.05, 0, 2.6), V(X1 + 0.25, 3.1, 2.7)), cream); b.add(boxGeo(V(X1 - 0.05, 3.0, 0.9), V(X1 + 0.25, 3.15, 2.7)), cream);
  const beyond = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.0), new THREE.MeshBasicMaterial({ color: "#f2e2c0" })); beyond.position.set(X1 + 1.2, 1.5, 1.8); beyond.rotation.y = -Math.PI / 2; root.add(beyond);
  // ceiling with the skylight: glass grid over a bright sky
  b.add(boxGeo(V(X0, HT, Z0), V(-3, HT + 0.2, Z1)), cream); b.add(boxGeo(V(3, HT, Z0), V(X1, HT + 0.2, Z1)), cream); b.add(boxGeo(V(-3, HT, Z0), V(3, HT + 0.2, -3.5)), cream); b.add(boxGeo(V(-3, HT, 4), V(3, HT + 0.2, Z1)), cream);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(6, 7.5).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color("#e8f4ff").multiplyScalar(1.3) })); sky.position.set(0, HT + 0.6, 0.25); sky.scale.set(1, 1.6, 1); root.add(sky);
  for (let x = -3; x <= 3; x += 0.75) b.add(boxGeo(V(x - 0.03, HT + 0.15, -3.5), V(x + 0.03, HT + 0.25, 4)), metal("muIron", "#3a3a44", 40));
  for (let zz = -3.5; zz <= 4; zz += 0.75) b.add(boxGeo(V(-3, HT + 0.15, zz - 0.03), V(3, HT + 0.25, zz + 0.03)), metal("muIron", "#3a3a44", 40));
  const skyL = new THREE.DirectionalLight("#fff4e0", 1.2); skyL.position.set(0.5, 10, 1); skyL.target.position.set(0, 0, -1); root.add(skyL, skyL.target);
  for (const [x, zz] of [[-2, -2], [2, 2], [0, 0]] as [number, number][]) { const pl = new THREE.PointLight("#fff0d8", 5, 12, 1.1); pl.position.set(x, 4.2, zz); root.add(pl); }
  // THE PAINTING on the end wall, picture lamp above, a little brass label
  const MPZ = Z0 + 0.12, MPY = 2.35;
  const PAINT = framedPainting(root, [0, MPY, MPZ], 0, 1.2, 1.48, 0.16);
  b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 10).rotateZ(Math.PI / 2).translate(0, MPY + 1.05, MPZ + 0.25), brass);
  rod(root, [0, MPY + 1.12, MPZ + 0.02], [0, MPY + 1.05, MPZ + 0.25], 0.012, brass);
  const plamp = new THREE.SpotLight("#ffe2b0", 9, 4, 0.7, 0.5, 1.2); plamp.position.set(0, MPY + 1.0, MPZ + 0.3); plamp.target.position.set(0, MPY - 0.3, MPZ); root.add(plamp, plamp.target);
  glow(root, [0, MPY + 1.0, MPZ + 0.3], "#ffe6b8", 0.8, 0.7);
  { const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.1), new THREE.MeshBasicMaterial({ map: ctex("muLabel", 256, 72, (g) => { g.fillStyle = "#d9b45a"; g.fillRect(0, 0, 256, 72); g.fillStyle = "#3a2214"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "C. 1660 - LOST WORK", 128, 38, 230, 40); }) })); lb.position.set(0.78, 1.4, MPZ + 0.01); root.add(lb); }
  // the two hooks either side + the two new fakes that get carried in (c.hang2 / c.hang3)
  const H2: V3 = [-1.38, 2.35, MPZ], H3: V3 = [1.38, 2.35, MPZ];
  const P2 = framedPainting(root, H2, 0, 0.8, 1.0, 0.12), P3 = framedPainting(root, H3, 0, 0.8, 1.0, 0.12);
  P2.set({ paint: 1, age: 1, crack: 1, ink: 0.6 }); P3.set({ paint: 1, age: 0.9, crack: 1, ink: 0.6 });
  // other pictures on the side walls
  for (let k = 0; k < 6; k++) { const zz = -2.6 + k * 2.0; framedPainting(root, [X0 + 0.1, 2.4 + (k % 2) * 0.2, zz], Math.PI / 2, 0.9, 1.1, 0.12, k); }
  for (let k = 0; k < 2; k++) framedPainting(root, [X1 - 0.1, 2.4, -2.8 + k * 6.2], -Math.PI / 2, 0.9, 1.1, 0.12, 4 + k);
  // velvet rope on brass posts in front of the masterpiece, a bench
  const redV = lam("muVelvet", () => ({ color: "#a01e2e" }));
  for (const x of [-1.2, 1.2]) { b.add(new THREE.CylinderGeometry(0.035, 0.07, 0.95, 10).translate(x, 0.47, -3.0), brass); b.add(new THREE.SphereGeometry(0.06, 10, 8).translate(x, 0.97, -3.0), brass); b.add(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 16).translate(x, 0.015, -3.0), brass); }
  { const pts: THREE.Vector3[] = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(V(-1.2 + 2.4 * t, 0.9 - 0.22 * Math.sin(Math.PI * t), -3.0)); } root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.03, 6), redV)); }
  { const g = new THREE.Group(); g.position.set(0, 0, 1.6); root.add(g); g.add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.55).translate(0, 0.45, 0), lam("muBench", () => ({ color: "#2f5a3e" })))); for (const s of [-1, 1]) g.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.5).translate(s * 1.0, 0.21, 0), dado)); }
  const dust = motes(root, [-2.5, 0.5, -4], [2.5, 4.6, 3], 50, "#fff6e0", 0.022, 0.6, 8);
  b.build(root);
  const DOOR: V3 = [X1 + 0.6, 0, 1.8];
  const marks: Record<string, V3> = {
    expert: [-0.55, 0, -2.75], director: [0.95, 0, -2.6], painterM: [1.75, 0, -1.6], porter1: [-2.1, 0, -3.1], porter2: [2.1, 0, -3.1], door: DOOR,
    painting: [0, MPY, MPZ], hang2: H2, hang3: H3,
  };
  const cams = {
    wide: { pos: [0.3, 1.9, 4.6] as V3, look: [0, 1.8, -4.2] as V3, fov: 46 },
    painting: { pos: [0.1, 2.0, -1.2] as V3, look: [0, 2.2, -4.4] as V3, fov: 40 },
    expert: { pos: [0.8, 1.7, -0.4] as V3, look: [-0.3, 1.6, -3.4] as V3, fov: 40 },
  };
  const cl = (x: number) => Math.max(0, Math.min(1, x)), ss = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
  // a carried picture: from the doorway at hand height to the hook (last 25 % = lift onto the hook)
  const carry = (P: { g: THREE.Group }, hook: V3, k: number, side: number) => {
    P.g.visible = k > 0.001;
    const a: V3 = [DOOR[0] - 0.4, 1.35, DOOR[2] - 0.2], m: V3 = [hook[0] + side * 0.3, 1.35, hook[2] + 0.75];
    const u1 = ss(k / 0.75), u2 = ss((k - 0.75) / 0.25);
    const p = k < 0.75 ? [a[0] + (m[0] - a[0]) * u1, a[1], a[2] + (m[2] - a[2]) * u1] : [m[0] + (hook[0] - m[0]) * u2, m[1] + (hook[1] - m[1]) * u2, m[2] + (hook[2] - m[2]) * u2];
    P.g.position.set(p[0], p[1], p[2]); P.g.rotation.set(0, k < 0.75 ? -0.6 * (1 - u1) : 0, 0);
  };
  return {
    name: "museum", root, marks, cams,
    pose: (t, c) => {
      dust.update(t);
      PAINT.set({ paint: 1, age: 1, crack: 1, ink: 0.6 });
      carry(P2, H2, cl(c.hang2 ?? 0), 1); carry(P3, H3, cl(c.hang3 ?? 0), -1);
      plamp.intensity = 9 * (0.98 + 0.02 * Math.sin(t * 23));
    },
  };
};

export const hall: SetBuilder = () => {
  const root = new THREE.Group(), b = new Batch();
  const X0 = -5, X1 = 5, Z0 = -4.5, Z1 = 5, HT = 6;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0).rotateX(-Math.PI / 2), lam("haFloor", () => ({ map: rep(marble("HaFloor", "#3a3440", "#8a7a6a"), 3, 3) }))); floor.position.set(0, 0, (Z0 + Z1) / 2); floor.receiveShadow = true; root.add(floor);
  const wallM = lam("haWall", () => ({ map: rep(damask("Ha", "#3a2a3a", "rgba(220,180,120,0.14)"), 4, 2) })), panel = lam("haPanel", () => ({ map: beamStain("haPanel", "#3a1a12", 0.55) })), gold = metal("haGold", "#e0ac44", 70);
  const wall = (x0: number, z0: number, x1: number, z1: number) => { b.add(boxGeo(V(x0, 0, z0), V(x1, 1.6, z1), 1), panel); b.add(boxGeo(V(x0, 1.6, z0), V(x1, HT, z1), 1), wallM); b.add(boxGeo(V(x0, 1.58, z0), V(x1, 1.68, z1)), gold); };
  wall(X0, Z0 - 0.2, X1, Z0); wall(X0 - 0.2, Z0, X0, Z1); wall(X1, Z0, X1 + 0.2, 0.6); wall(X1, 2.8, X1 + 0.2, Z1); b.add(boxGeo(V(X1, 3.4, 0.6), V(X1 + 0.2, HT, 2.8), 1), wallM);
  b.add(boxGeo(V(X0, HT, Z0), V(X1, HT + 0.2, Z1)), lam("haCeil", () => ({ color: "#2a2230" })));
  // tall red drapes on the back wall (no emblems), a big window of night between them
  const drape = lam("haDrape", () => ({ map: ctex("haDrapeT", 256, 512, (g) => { g.fillStyle = "#8e1e2a"; g.fillRect(0, 0, 256, 512); for (let x = 0; x < 256; x += 32) { const gr = g.createLinearGradient(x, 0, x + 32, 0); gr.addColorStop(0, "rgba(255,160,160,0.18)"); gr.addColorStop(1, "rgba(30,0,10,0.35)"); g.fillStyle = gr; g.fillRect(x, 0, 32, 512); } g.fillStyle = "#d9b45a"; g.fillRect(0, 488, 256, 14); }) }));
  for (const x of [-3.4, -1.3, 1.3, 3.4]) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.9, 5.2, 0.12), drape); d.position.set(x, 2.8, Z0 + 0.15); d.castShadow = true; root.add(d); }
  const nightM = new THREE.MeshBasicMaterial({ map: ctex("haNight", 256, 512, (g, r) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#0e1440"); gr.addColorStop(1, "#2a3a80"); g.fillStyle = gr; g.fillRect(0, 0, 256, 512); for (let i = 0; i < 50; i++) { g.fillStyle = "rgba(255,255,230,0.8)"; g.beginPath(); g.arc(r() * 256, r() * 320, 1.4, 0, TAU); g.fill(); } g.fillStyle = "#fff2cc"; g.beginPath(); g.arc(180, 90, 22, 0, TAU); g.fill(); g.fillStyle = "#141a40"; g.beginPath(); g.moveTo(0, 512); for (let x = 0; x <= 256; x += 16) g.lineTo(x, 420 - 40 * Math.abs(Math.sin(x * 0.03))); g.lineTo(256, 512); g.fill(); }) });
  for (const x of [-2.35, 2.35]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 3.4), nightM); w.position.set(x, 3.0, Z0 + 0.05); root.add(w); b.add(boxGeo(V(x - 0.6, 1.25, Z0), V(x + 0.6, 1.33, Z0 + 0.18)), gold); }
  // fireplace on the left wall (x -5) with a fire (the warm light) + a big gilded mirror over it
  b.add(boxGeo(V(X0, 0, -0.9), V(X0 + 0.5, 1.5, 0.9)), lam("haMarble", () => ({ map: marble("HaMarble", "#e8e0d0", "#d0c4b0") })));
  b.add(boxGeo(V(X0 + 0.1, 0, -0.55), V(X0 + 0.52, 1.0, 0.55)), lam("haHearth", () => ({ color: "#1a1214" })));
  const fireM = new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffa040").multiplyScalar(2.2), transparent: true, opacity: 0.95 });
  const flames: THREE.Mesh[] = []; for (let k = 0; k < 5; k++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.1 + (k % 2) * 0.05, 0.4 + (k % 3) * 0.12, 8), fireM); f.position.set(X0 + 0.32, 0.25, -0.3 + k * 0.15); f.layers.set(NOINK); root.add(f); flames.push(f); }
  const fireL = new THREE.PointLight("#ff9a4a", 9, 9, 1.3); fireL.position.set(X0 + 0.9, 0.7, 0); root.add(fireL); const fireG = glow(root, [X0 + 0.55, 0.45, 0], "#ffa050", 1.6, 0.8);
  const mirror = framedPainting(root, [X0 + 0.08, 2.9, 0], Math.PI / 2, 1.2, 1.4, 0.14, 2); void mirror;
  // chandelier (candle bulbs) over the desk
  const chand = new THREE.Group(); chand.position.set(0, HT - 1.4, -1.2); root.add(chand);
  rod(root, [0, HT, -1.2], [0, HT - 1.2, -1.2], 0.015, gold);
  chand.add(new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.03, 8, 30).rotateX(Math.PI / 2), gold));
  const cands: THREE.Object3D[] = []; for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; cands.push(candle(chand, [Math.cos(a) * 0.55, 0.02, Math.sin(a) * 0.55], 0.8, k % 3 ? 0 : 3, 5)); }
  // the huge desk + papers + a lamp; THE PAINTING on an easel next to it (lit)
  const desk = lam("haDesk", () => ({ map: beamStain("haDesk", "#4a2414", 0.5) }));
  b.add(boxGeo(V(-1.6, 0, -2.6), V(1.6, 0.9, -1.7), 1), desk); b.add(boxGeo(V(-1.7, 0.9, -2.7), V(1.7, 0.98, -1.6), 1), lam("haLeather", () => ({ color: "#2f4a3a" })));
  for (let k = 0; k < 3; k++) { const pp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.4), lam("haPaper" + k, () => ({ color: "#f2ead4" }))); pp.position.set(-0.9 + k * 0.4, 0.99 + k * 0.01, -2.1); pp.rotation.y = 0.2 * k; root.add(pp); }
  const ea = new THREE.Group(); ea.position.set(1.75, 0, -0.9); ea.rotation.y = -0.35; root.add(ea);
  rod(ea, [-0.45, 0, 0.2], [-0.06, 2.3, -0.05], 0.03, gold); rod(ea, [0.45, 0, 0.2], [0.06, 2.3, -0.05], 0.03, gold); rod(ea, [0, 0, -0.6], [0, 2.2, -0.08], 0.028, gold);
  ea.add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.14).translate(0, 1.55 - 0.53 - 0.16, 0.06), gold));
  const PAINT = framedPainting(ea, [0, 1.55, 0.08], 0, 0.86, 1.06, 0.11);
  const spot = new THREE.SpotLight("#ffe2b0", 14, 6, 0.5, 0.5, 1.2); spot.position.set(0.8, 4.4, 0.6); spot.target.position.set(1.75, 1.55, -0.9); root.add(spot, spot.target);
  // THE CART: a long wagon piled with stacked framed paintings (137 on the tag); rolls toward the door (x 5, z 1.7)
  const cart = new THREE.Group(); root.add(cart);
  const wood = lam("haCartW", () => ({ map: beamStain("haCartW", "#7a4a2a", 0.4) }));
  cart.add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.1).translate(0, 0.42, 0), wood));
  for (const [x, zz] of [[-1.0, -0.6], [1.0, -0.6], [-1.0, 0.6], [1.0, 0.6]]) cart.add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 16).rotateX(Math.PI / 2).translate(x, 0.28, zz), metal("haWheel", "#2a2a30", 40)));
  for (let k = 0; k < 24; k++) { const w = 0.5 + (k % 4) * 0.12, h = 0.55 + (k % 3) * 0.15, x = -1.0 + (k % 6) * 0.4, y = 0.48 + Math.floor(k / 6) * 0.42; const pic = framedPainting(cart, [x, y + h / 2, (k % 2 ? -0.25 : 0.25)], (k % 2 ? 0.08 : -0.08), w, h, 0.07, k % 8); pic.g.rotation.x = -Math.PI / 2 + 0.25 * (k % 2 ? 1 : -1); pic.g.position.y = y + 0.06; }
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshBasicMaterial({ map: ctex("haTag", 256, 160, (g) => { g.fillStyle = "#f2ead2"; g.fillRect(0, 0, 256, 160); g.strokeStyle = "#5a3a22"; g.lineWidth = 8; g.strokeRect(6, 6, 244, 148); g.fillStyle = "#2a1a10"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "137", 128, 70, 200, 96); fitText(g, "PAINTINGS", 128, 128, 200, 30); }) }));
  tag.scale.set(1.7, 1.7, 1); tag.position.set(-1.37, 0.66, 0); tag.rotation.y = -Math.PI / 2; cart.add(tag);   // on the rear face, toward the cart camera
  rod(cart, [1.3, 0.48, 0], [2.0, 0.9, 0], 0.03, wood);
  b.build(root);
  // corridor beyond the right-hand door (the cart rolls out into it), warm-lit so the doorway never shows a void
  { const cw = lam("haCorrW", () => ({ color: "#6a4038" })), cf = lam("haCorrF", () => ({ map: rep(marble("HaFloor", "#3a3440", "#8a7a6a"), 2, 1) }));
    b.add(boxGeo(V(X1, -0.02, 0.4), V(9.0, 0, 3.0)), cf); b.add(boxGeo(V(X1 + 0.2, 0, 0.4), V(9.0, 3.4, 0.6), 1), cw); b.add(boxGeo(V(X1 + 0.2, 0, 2.8), V(9.0, 3.4, 3.0), 1), cw);
    b.add(boxGeo(V(8.8, 0, 0.4), V(9.0, 3.4, 3.0), 1), cw); b.add(boxGeo(V(X1, 3.4, 0.4), V(9.0, 3.6, 3.0)), lam("haCeil", () => ({ color: "#2a2230" })));
    const cl2 = new THREE.PointLight("#ffb070", 7, 7, 1.3); cl2.position.set(7.2, 2.6, 1.7); root.add(cl2); glow(root, [8.7, 2.4, 1.7], "#ffc080", 0.9, 0.5); }
  const CART0: V3 = [3.3, 0, 1.9], CART1: V3 = [6.4, 0, 1.75];
  const marks: Record<string, V3> = { official: [0.75, 0, -1.25], cartPusher: [CART0[0] - 1.0, 0, CART0[2] - 0.85], dealer: [-0.6, 0, -0.3], soldier: [-2.6, 0, 0.6], painting: [1.75, 1.55, -0.85], cart: CART0 };
  const cams = { wide: { pos: [0.2, 2.2, 5.0] as V3, look: [0.4, 1.4, -1.4] as V3, fov: 46 }, official: { pos: [0.4, 1.7, 1.6] as V3, look: [1.2, 1.5, -1.0] as V3, fov: 40 } };
  const cl = (x: number) => Math.max(0, Math.min(1, x)), ss = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
  return {
    name: "hall", root, marks, cams,
    pose: (t, c) => {
      PAINT.set({ paint: 1, age: 1, crack: 1, ink: 0.6 });
      const k = ss(c.cart ?? 0); cart.position.set(CART0[0] + (CART1[0] - CART0[0]) * k, 0, CART0[2] + (CART1[2] - CART0[2]) * k); cart.rotation.y = 0.05 * Math.sin(t * 6) * (k > 0 && k < 1 ? 1 : 0);
      flames.forEach((f, i) => { f.scale.set(1, 0.8 + 0.3 * Math.abs(Math.sin(t * (7 + i) + i)), 1); f.position.x = X0 + 0.32 + 0.02 * Math.sin(t * 9 + i); });
      fireL.intensity = 9 * (0.85 + 0.15 * Math.sin(t * 11) * Math.sin(t * 4.3)); (fireG.material as THREE.SpriteMaterial).opacity = 0.7 + 0.2 * Math.sin(t * 8);
      cands.forEach((cd) => flameFlick(cd, t)); chand.rotation.y = 0.02 * Math.sin(t * 0.5);
    },
  };
};
