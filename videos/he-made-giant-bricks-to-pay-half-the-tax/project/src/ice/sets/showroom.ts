// THE SHOWROOM + THE STREET OUTSIDE, 1955 (scenes 2-3, the "safe car means a tank" setup).
// INSIDE x -5..5, z -4..3, ceiling 4: THE TANK CAR on a round turntable (x 1.5, z -0.6, nose +z toward the big open
// garage door x 0..3 in the glass front wall at z = 3), a painted banner "BUILT LIKE A TANK!" on the back wall, pennant
// strings, globe pendant lamps, a checker floor, potted palms, a price board "$2,995", a sales desk with a phone, a
// poster of the tank car, brochures. VANGUARD MOTORS lettering over the windows (invented).
// OUTSIDE z 3..16: sidewalk, asphalt road, the far sidewalk and a low red BRICK GARDEN WALL along z = 12.6 (with a
// hedge, a lamppost, a hydrant, a mailbox, a shop row behind under a blue sky). The tank car drives out (c.drive 0..1
// along the path), hits the wall (c.hit 0..1: bricks knocked loose and dust) and is not scratched.
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex, rep } from "../paint";
import { glow, rod } from "../setkit";
import { metal, roundTree, leafTex } from "./innerkit_b";
import { fitText } from "./portkit_common";
import { col, shiny, SANS, asphaltTex } from "./desertkit";
import { sedan } from "./sedan";
import type { SetDef, SetBuilder, V3 } from "./types";

const TAU = Math.PI * 2;
const checker = () => ctex("srChecker", 512, 512, (g, r) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? "#2f3440" : "#f2ead8"; g.fillRect(x * 64, y * 64, 64, 64); } for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${0.05 * r()})`; g.fillRect(r() * 512, r() * 512, 10 + r() * 30, 2); } });
const brickTex = () => ctex("srBrick", 512, 256, (g, r) => { g.fillStyle = "#c9b7a0"; g.fillRect(0, 0, 512, 256); for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 ? -32 : 0; x < 512; x += 64) { g.fillStyle = ["#b0473a", "#a8413a", "#bc5444", "#9e3d34"][Math.floor(r() * 4)]; g.fillRect(x + 3, y + 3, 58, 26); g.fillStyle = "rgba(255,210,180,0.15)"; g.fillRect(x + 3, y + 3, 58, 6); } });

export const showroom: SetBuilder = () => {
  const root = new THREE.Group(), b = new Batch();
  const X0 = -5, X1 = 5, Z0 = -4, ZF = 3, HT = 4;
  // floor: checker inside, sidewalk + road + far sidewalk outside
  { const f = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, ZF - Z0).rotateX(-Math.PI / 2), lam("srFloor", () => ({ map: rep(checker(), 3, 2) }))); f.position.set(0, 0.002, (Z0 + ZF) / 2); f.receiveShadow = true; root.add(f); }
  const walk = lam("srWalk", () => ({ color: "#cfc8b8" })), curb = lam("srCurb", () => ({ color: "#e8e2d4" }));
  b.add(boxGeo(V(-14, -0.02, ZF), V(14, 0.0, 5.2)), walk); b.add(boxGeo(V(-14, -0.02, 11), V(14, 0.0, 13.6)), walk);
  { const rd = new THREE.Mesh(new THREE.PlaneGeometry(28, 5.8).rotateX(-Math.PI / 2), lam("srRoad", () => ({ map: rep(asphaltTex(true), 6, 1) }))); rd.rotation.y = 0; rd.position.set(0, -0.01, 8.1); rd.receiveShadow = true; root.add(rd); }
  // walls: cream with a teal band; front = steel-framed glass with the open garage door x 0..3
  const wallM = lam("srWall", () => ({ color: "#f2e6c8" })), band = lam("srBand", () => ({ color: "#2a9d9a" })), steel = metal("srSteel", "#c9ced6", 80);
  b.add(boxGeo(V(X0, 0, Z0 - 0.2), V(X1, HT, Z0), 1), wallM); b.add(boxGeo(V(X0 - 0.2, 0, Z0), V(X0, HT, ZF), 1), wallM); b.add(boxGeo(V(X1, 0, Z0), V(X1 + 0.2, HT, ZF), 1), wallM);
  for (const [x0, x1] of [[X0, X1]] as [number, number][]) b.add(boxGeo(V(x0, 0.9, Z0 + 0.001), V(x1, 1.1, Z0 + 0.02)), band);
  b.add(boxGeo(V(X0, HT, Z0), V(X1, HT + 0.15, ZF)), lam("srCeil", () => ({ color: "#f6efdc" })));
  b.add(boxGeo(V(X0, 3.0, ZF - 0.1), V(X1, HT, ZF + 0.05), 1), band);             // fascia over the windows
  for (const x of [X0, -3.3, -1.6, 0, 3.0, X1]) b.add(boxGeo(V(x - 0.05, 0, ZF - 0.08), V(x + 0.05, 3.0, ZF + 0.02)), steel);
  b.add(boxGeo(V(X0, 0, ZF - 0.08), V(0, 0.45, ZF + 0.02)), band); b.add(boxGeo(V(3.0, 0, ZF - 0.08), V(X1, 0.45, ZF + 0.02)), band);
  { const gm = new THREE.MeshPhongMaterial({ color: "#cfeaf8", transparent: true, opacity: 0.1, depthWrite: false, shininess: 140 });
    for (const [x0, x1] of [[X0, 0], [3.0, X1]] as [number, number][]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 2.55), gm); m.position.set((x0 + x1) / 2, 1.72, ZF - 0.03); root.add(m); } }
  // VANGUARD MOTORS lettering on the fascia (outside), BUILT LIKE A TANK! banner inside, price board, poster
  const sign = (key: string, w: number, h: number, pos: V3, yaw: number, draw: (g: CanvasRenderingContext2D) => void, cw = 1024, ch = 256) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: ctex(key, cw, ch, draw) })); m.position.set(...pos); m.rotation.y = yaw; root.add(m); return m; };
  sign("srFascia", 6.0, 0.7, [0, 3.5, ZF + 0.07], 0, (g) => { g.fillStyle = "#2a9d9a"; g.fillRect(0, 0, 1024, 128); g.fillStyle = "#fff4d6"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "VANGUARD MOTORS", 512, 66, 960, 92, SANS); }, 1024, 128);
  sign("srBanner", 2.5, 1.25, [0.9, 2.85, -3.3], 0, (g) => { g.fillStyle = "#c8352e"; g.fillRect(0, 0, 1024, 512); g.strokeStyle = "#fff4d6"; g.lineWidth = 16; g.strokeRect(16, 16, 992, 480); g.fillStyle = "#fff4d6"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "BUILT LIKE", 512, 160, 900, 180, SANS); fitText(g, "A TANK!", 512, 360, 900, 190, SANS); }, 1024, 512);
  for (const x of [-0.25, 2.05]) rod(root, [x, 3.47, -3.3], [x, HT, -3.3], 0.012, steel);   // hangs from the ceiling over the car
  sign("srPrice", 0.9, 0.62, [3.4, 1.1, -0.2], -0.5, (g) => { g.fillStyle = "#fff4d6"; g.fillRect(0, 0, 512, 352); g.strokeStyle = "#2a9d9a"; g.lineWidth = 18; g.strokeRect(9, 9, 494, 334); g.fillStyle = "#2a2230"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "THE IRONCLAD", 256, 90, 440, 56, SANS); g.fillStyle = "#c8352e"; fitText(g, "$2,995", 256, 200, 420, 120, SANS); g.fillStyle = "#2a2230"; fitText(g, "SOLID STEEL!", 256, 290, 400, 44, SANS); }, 512, 352);
  rod(root, [3.4, 0, -0.2], [3.4, 0.8, -0.2], 0.025, steel);
  sign("srPoster", 1.1, 1.5, [-4.97, 1.9, -1.6], Math.PI / 2, (g) => { g.fillStyle = "#f2e6c8"; g.fillRect(0, 0, 512, 700); g.fillStyle = "#2a9d9a"; g.fillRect(0, 0, 512, 160); g.fillStyle = "#fff4d6"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "IRONCLAD 1955", 256, 82, 460, 80, SANS); g.fillStyle = "#22212b"; g.beginPath(); g.roundRect(60, 330, 390, 130, 40); g.fill(); g.beginPath(); g.roundRect(150, 260, 210, 100, 30); g.fill(); g.fillStyle = "#e8e8f0"; g.beginPath(); g.arc(140, 470, 48, 0, TAU); g.arc(380, 470, 48, 0, TAU); g.fill(); g.fillStyle = "#c8352e"; fitText(g, "NOTHING BENDS", 256, 610, 440, 64, SANS); }, 512, 700);
  // pennant strings across the ceiling
  { const cols = ["#c8352e", "#f2c230", "#2a9d9a", "#f4f1ea"]; for (const z of [-2.4, 0.2]) for (let i = 0; i < 18; i++) { const x = X0 + 0.3 + i * 0.55, y = 3.75 - 0.2 * Math.sin((i / 17) * Math.PI); const tr = new THREE.BufferGeometry(); tr.setAttribute("position", new THREE.Float32BufferAttribute([x - 0.18, y, z, x + 0.18, y, z, x, y - 0.32, z], 3)); tr.computeVertexNormals(); b.add(tr, lam("srPen" + (i % 4), () => ({ color: cols[i % 4], side: THREE.DoubleSide }))); } }
  // globe pendants
  for (const [x, z] of [[-2.6, -1.8], [2.4, -1.8], [-2.6, 1.0], [2.4, 1.0]] as [number, number][]) { rod(root, [x, HT, z], [x, 3.2, z], 0.01, steel); b.add(new THREE.SphereGeometry(0.2, 16, 12).translate(x, 3.05, z), lam("srGlobe", () => ({ color: "#fff6dc", emissive: "#ffe8b0" }))); glow(root, [x, 3.05, z], "#fff0c8", 0.9, 0.8); const pl = new THREE.PointLight("#ffe8c0", 4, 7, 1.2); pl.position.set(x, 2.9, z); root.add(pl); }
  // the turntable (chrome ring), the sales desk + phone + brochures, potted palms
  const TT: V3 = [1.5, 0, -1.2];
  b.add(new THREE.CylinderGeometry(2.7, 2.7, 0.08, 40).translate(TT[0], 0.04, TT[2]), lam("srTurn", () => ({ color: "#3a3f4a" }))); b.add(new THREE.TorusGeometry(2.7, 0.04, 6, 48).rotateX(Math.PI / 2).translate(TT[0], 0.08, TT[2]), steel);
  b.add(boxGeo(V(-4.2, 0, -3.2), V(-2.4, 0.78, -2.4), 1), lam("srDesk", () => ({ color: "#2a9d9a" }))); b.add(boxGeo(V(-4.25, 0.78, -3.25), V(-2.35, 0.84, -2.35)), lam("srDeskTop", () => ({ color: "#f2ead8" })));
  b.add(boxGeo(V(-3.1, 0.84, -3.0), V(-2.8, 0.94, -2.8)), col("#22212b")); b.add(new THREE.TorusGeometry(0.1, 0.03, 6, 14, Math.PI).translate(-2.95, 0.98, -2.9), col("#22212b"));
  const leaf = lam("srLeaf", () => ({ map: leafTex("srL", "#3f8a5a", "#7ac08a", "#2a5a3a") })), bark = lam("srBark", () => ({ color: "#6b4a2f" }));
  for (const [x, z] of [[-4.4, 2.2], [4.4, -3.3]] as [number, number][]) { b.add(new THREE.CylinderGeometry(0.28, 0.22, 0.5, 14).translate(x, 0.25, z), shiny("srPot", "#c26a2c", 30)); roundTree(b, x, z, 1.7, 7, leaf, bark, 0.4); }
  // ---------------- outside: the brick garden wall, hedge, lamppost, hydrant, mailbox, shop row ----------------
  const WZ = 12.6;
  const bricks = lam("srBrickM", () => ({ map: rep(brickTex(), 4, 1) }));
  b.add(boxGeo(V(-7, 0, WZ), V(-1.3, 1.1, WZ + 0.4), 1), bricks); b.add(boxGeo(V(4.3, 0, WZ), V(9, 1.1, WZ + 0.4), 1), bricks);
  b.add(boxGeo(V(-7, 1.1, WZ - 0.03), V(9, 1.2, WZ + 0.43)), lam("srCap", () => ({ color: "#d8cfc0" })));
  // the stretch the car hits (x -1.3..4.3) is made of loose bricks so a few can be knocked out
  const loose: { m: THREE.Mesh; p0: THREE.Vector3; v: THREE.Vector3; spin: THREE.Vector3; hit: boolean }[] = [];
  { const bm = lam("srBrickL", () => ({ color: "#b0473a" }));
    for (let row = 0; row < 5; row++) for (let i = 0; i < 12; i++) { const x = -1.3 + 0.23 + i * 0.47 - (row % 2 ? 0.23 : 0); if (x < -1.25 || x > 4.25) continue; const m = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.2, 0.4), bm); m.position.set(x, 0.11 + row * 0.22, WZ + 0.2); m.castShadow = true; root.add(m);
      const hit = Math.abs(x - 1.5) < 0.9 && row >= 1 && row <= 3; loose.push({ m, p0: m.position.clone(), v: new THREE.Vector3((x - 1.5) * 1.6, 1.2 + row * 0.5, 2.2 + 0.4 * (i % 3)), spin: new THREE.Vector3(i * 0.7, row, i), hit }); } }
  const hedge = lam("srHedge", () => ({ map: leafTex("srH", "#3f7a4a", "#6aaa6a", "#264a30") }));
  b.add(new THREE.BoxGeometry(16, 0.9, 0.8).translate(1, 1.5, WZ + 1.0), hedge);
  // shop row across the street behind the wall (simple facades) + sky band
  const shopCols = ["#e8b04a", "#7aa8c8", "#e86a8a", "#9acb8a", "#f2e6c8"];
  for (let i = 0; i < 6; i++) { const x = -9 + i * 3.6; b.add(boxGeo(V(x, 0, 15.2), V(x + 3.5, 4.5 + (i % 3) * 0.6, 16)), lam("srShop" + i, () => ({ color: shopCols[i % 5] }))); b.add(boxGeo(V(x + 0.3, 0.3, 15.15), V(x + 3.2, 2.4, 15.2)), lam("srShopWin", () => ({ color: "#cfe6f2" }))); b.add(boxGeo(V(x + 0.2, 2.5, 14.8), V(x + 3.3, 2.65, 15.2)), lam("srAwn" + i, () => ({ color: ["#c8352e", "#2a9d9a", "#f2c230"][i % 3] }))); }
  rod(root, [-1.9, 0, 11.5], [-1.9, 3.6, 11.5], 0.06, col("#2f3440")); b.add(new THREE.SphereGeometry(0.22, 14, 10).translate(-1.9, 3.75, 11.5), lam("srLampG", () => ({ color: "#fff6dc", emissive: "#ffe8b0" })));
  b.add(new THREE.CylinderGeometry(0.14, 0.17, 0.62, 14).translate(5.3, 0.31, 11.6), shiny("srHydrant", "#c8352e", 40)); b.add(new THREE.SphereGeometry(0.15, 12, 8).translate(5.3, 0.64, 11.6), shiny("srHydrant", "#c8352e", 40));
  b.add(boxGeo(V(-4.4, 0, 11.4), V(-3.9, 1.05, 11.9)), shiny("srMail", "#2f5d9a", 40));
  b.build(root);
  // THE TANK CAR (the couple sit in it) on the turntable; path out through the door to the wall
  const tank = sedan(root, { style: "tank" });
  const CONTACT = WZ - tank.NOSE - 0.02;
  const marks: Record<string, V3> = {
    tank: TT, salesman: [TT[0] - 1.6, 0, TT[2] + 1.2], salesman2: [-2.6, 0, -2.8], hoodPt: [TT[0], 1.05, TT[2] + 2.2],
    walkOut: [3.2, 0, 4.2], wall: [1.5, 0, WZ], street: [1.5, 0, 9.0], crashCar: [TT[0], 0, CONTACT], passer: [-3.4, 0, 12.0],
  };
  const cams = { inside: { pos: [-1.4, 1.6, 3.2] as V3, look: [1.5, 1.0, -0.6] as V3, fov: 42 }, street: { pos: [-3.5, 1.7, 6.5] as V3, look: [1.5, 0.8, 11.0] as V3, fov: 42 } };
  const cl = (x: number) => Math.max(0, Math.min(1, x));
  return {
    name: "showroom", root, marks, cams,
    pose: (t, c) => {
      // drive: 0 on the turntable -> 1 nose against the wall (eased by the shot); hit 0..1 time since impact
      const d = cl(c.drive ?? 0), z = TT[2] + (CONTACT - TT[2]) * d;
      tank.g.position.set(TT[0], 0, z); tank.g.rotation.y = 0;
      tank.set({ dist: z - TT[2], shake: c.tshake ?? 0, t, door: c.tdoor ?? 0 });
      const h = c.hit ?? 0;
      for (const L of loose) { if (!L.hit || h <= 0) { L.m.position.copy(L.p0); L.m.rotation.set(0, 0, 0); continue; } const tt = Math.min(h, 1.2); const p = L.p0.clone().addScaledVector(L.v, tt * 0.5); p.y = Math.max(0.1, L.p0.y + L.v.y * tt * 0.5 - 4.9 * tt * tt * 0.25); L.m.position.copy(p); L.m.rotation.set(L.spin.x * tt, L.spin.y * tt, L.spin.z * tt); }
    },
  };
};
