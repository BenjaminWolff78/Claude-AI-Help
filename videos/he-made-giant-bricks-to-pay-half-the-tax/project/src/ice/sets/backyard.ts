// THE BACKYARD, today, sunny (scene 7: the water-balloon demo, "Ever caught a water balloon?").
// Lawn x -6..6, z -5..5. The back of a pale-blue clapboard house along z = -4.5 (a door with a window lit warm, a
// porch light, a gutter), a white picket fence round the sides with a ginger cat sitting on it, a big round tree (left),
// a clothesline with laundry that sways, a red bucket full of water balloons, a coiled green garden hose, a blue kiddie
// pool, a birdbath, a sun lounger. Two balloons fly from the friend (right) to YOU (left): c.b1 / c.b2 0..1 = flight,
// c.b1pop 0..1 = burst (the balloon shrinks to nothing while the splash cards play), c.b2squash = the caught balloon's
// wobble (-1..1), c.wet 0..1 darkens a puddle on the grass.
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex, rep, grassHD, planksHD } from "../paint";
import { glow, rod } from "../setkit";
import { roundTree, leafTex } from "./innerkit_b";
import { col, shiny } from "./desertkit";
import type { SetDef, SetBuilder, V3 } from "./types";

const TAU = Math.PI * 2;
const clapTex = () => ctex("byClap", 512, 512, (g, r) => { for (let y = 0; y < 512; y += 32) { g.fillStyle = "#9cc4dc"; g.fillRect(0, y, 512, 32); g.fillStyle = "#7aa6c2"; g.fillRect(0, y + 26, 512, 6); g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(0, y, 512, 4); } for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(60,80,100,${0.06 * r()})`; g.fillRect(r() * 512, r() * 512, 20 + r() * 40, 2); } });

export const backyard: SetBuilder = () => {
  const root = new THREE.Group(), b = new Batch();
  { const gm = new THREE.Mesh(new THREE.PlaneGeometry(30, 24).rotateX(-Math.PI / 2), lam("byGrass", () => ({ map: rep(grassHD(), 6, 5), color: "#b4c8a0" }))); gm.position.set(0, 0, 2); gm.receiveShadow = true; root.add(gm); }
  // the house wall with door, window, porch light, gutter
  const clap = lam("byClapM", () => ({ map: rep(clapTex(), 4, 2) })), white = lam("byWhite", () => ({ color: "#f8f4ea" }));
  b.add(boxGeo(V(-9, 0, -5.0), V(9, 4.6, -4.5), 1), clap);
  b.add(boxGeo(V(-9, 4.6, -5.4), V(9, 4.75, -4.3)), white);
  b.add(boxGeo(V(-1.2, 0, -4.52), V(-0.1, 2.2, -4.44)), lam("byDoor", () => ({ color: "#c8352e" })));
  b.add(boxGeo(V(-1.3, 0, -4.5), V(-0.0, 2.3, -4.42)), white);
  { const wn = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.1), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffe8b8") })); wn.position.set(2.2, 1.9, -4.43); root.add(wn); b.add(boxGeo(V(1.42, 1.28, -4.47), V(2.98, 2.52, -4.43)), white); b.add(boxGeo(V(2.17, 1.35, -4.44), V(2.23, 2.45, -4.41)), white); }
  b.add(new THREE.CylinderGeometry(0.1, 0.12, 0.22, 12).translate(0.25, 2.45, -4.4), lam("byPorch", () => ({ color: "#fff6dc", emissive: "#ffe8b0" }))); glow(root, [0.25, 2.45, -4.3], "#fff0c8", 0.6, 0.7);
  // picket fences (sides + back corners) with a cat sitting on the left fence
  const picket = lam("byPicket", () => ({ color: "#fbf8f0" }));
  for (const sx of [-6.2, 6.2]) { for (let z = -4.4; z < 6; z += 0.24) { b.add(boxGeo(V(sx - 0.03, 0, z - 0.05), V(sx + 0.03, 1.05, z + 0.05)), picket); b.add(new THREE.ConeGeometry(0.07, 0.12, 4).rotateY(Math.PI / 4).translate(sx, 1.1, z), picket); } for (const y of [0.3, 0.8]) b.add(boxGeo(V(sx - 0.05, y, -4.4), V(sx + 0.05, y + 0.08, 6)), picket); }
  const cat = new THREE.Group(); cat.position.set(-6.2, 1.12, -1.2); root.add(cat);
  { const fur = lam("byCat", () => ({ color: "#e8913a" })); cat.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10).scale(0.9, 1.1, 1.2).translate(0, 0.16, 0), fur)); cat.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10).translate(0, 0.38, 0.06), fur)); for (const s of [-1, 1]) cat.add(new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 4).translate(s * 0.06, 0.49, 0.06), fur)); }
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.42, 6).translate(0, -0.21, 0), lam("byCat", () => ({ color: "#e8913a" }))); tail.position.set(0, 0.12, -0.18); cat.add(tail);
  // big tree (left back), clothesline with laundry, kiddie pool, bucket of balloons, hose, birdbath, lounger
  const leaf = lam("byLeaf", () => ({ map: leafTex("byL", "#4a9a5a", "#8ad08a", "#2a6a3a") })), bark = lam("byBark", () => ({ color: "#6b4a2f" }));
  roundTree(b, -4.6, -3.2, 4.6, 11, leaf, bark); roundTree(b, 5.0, -3.6, 3.4, 13, leaf, bark);
  rod(root, [-3.4, 0, -2.6], [-3.4, 2.3, -2.6], 0.04, col("#8a8a96")); rod(root, [3.8, 0, -2.6], [3.8, 2.3, -2.6], 0.04, col("#8a8a96")); rod(root, [-3.4, 2.25, -2.6], [3.8, 2.25, -2.6], 0.008, col("#f4f1ea"));
  const laundry: THREE.Mesh[] = [];
  { const cols = ["#f2c230", "#e86a8a", "#7aa8c8", "#f4f1ea", "#3fae6a"]; for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.55 + (i % 2) * 0.2, 0.7 + (i % 3) * 0.12).translate(0, -0.35, 0), lam("byCloth" + i, () => ({ color: cols[i], side: THREE.DoubleSide }))); m.position.set(-2.6 + i * 1.3, 2.24, -2.6); m.castShadow = true; root.add(m); laundry.push(m); } }
  b.add(new THREE.CylinderGeometry(1.1, 1.1, 0.32, 28, 1, true).translate(3.4, 0.16, 1.6), shiny("byPool", "#2f8ad8", 60)); { const w = new THREE.Mesh(new THREE.CircleGeometry(1.06, 28).rotateX(-Math.PI / 2), shiny("byPoolW", "#9ad7f2", 120)); w.position.set(3.4, 0.25, 1.6); root.add(w); }
  const BUCKET: V3 = [2.1, 0, -0.6];
  b.add(new THREE.CylinderGeometry(0.28, 0.22, 0.42, 16, 1, true).translate(BUCKET[0], 0.21, BUCKET[2]), shiny("byBucket", "#c8352e", 40)); b.add(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 16).translate(BUCKET[0], 0.01, BUCKET[2]), shiny("byBucket", "#c8352e", 40));
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; b.add(new THREE.SphereGeometry(0.1, 12, 10).translate(BUCKET[0] + Math.cos(a) * 0.12, 0.42, BUCKET[2] + Math.sin(a) * 0.12), shiny("byBal" + (i % 3), ["#e8463a", "#3f8ad8", "#f2c230"][i % 3], 90)); }
  b.add(new THREE.TorusGeometry(0.35, 0.04, 6, 24).rotateX(Math.PI / 2).translate(-2.4, 0.04, -3.6), col("#3f8a3a")); b.add(new THREE.TorusGeometry(0.26, 0.04, 6, 24).rotateX(Math.PI / 2).translate(-2.4, 0.11, -3.6), col("#3f8a3a"));
  b.add(new THREE.CylinderGeometry(0.08, 0.14, 0.8, 12).translate(-4.6, 0.4, 2.2), lam("byStone", () => ({ color: "#c9c2b4" }))); b.add(new THREE.CylinderGeometry(0.42, 0.3, 0.12, 18).translate(-4.6, 0.86, 2.2), lam("byStone", () => ({ color: "#c9c2b4" })));
  b.add(boxGeo(V(4.4, 0.25, -1.4), V(5.0, 0.32, 0.4)), lam("byLounge", () => ({ color: "#f2c230" })));
  // ---- the DOMINO TABLE ("They Blew Up Houses": the demo) - a picnic table on the lawn with two long lines of dominoes ----
  const tw = lam("byTable", () => ({ map: rep(planksHD(), 2, 1), color: "#c89a64" }));
  const TX = 0.6, TZ = 0.2, TY = 0.78;
  b.add(boxGeo(V(TX - 1.6, TY - 0.06, TZ - 0.55), V(TX + 1.6, TY, TZ + 0.55)), tw);
  for (const sx of [-1.2, 1.2]) for (const sz of [-0.42, 0.42]) b.add(boxGeo(V(TX + sx - 0.05, 0, TZ + sz - 0.05), V(TX + sx + 0.05, TY - 0.06, TZ + sz + 0.05)), tw);
  for (const sz of [0.95]) b.add(boxGeo(V(TX - 1.5, 0.42, TZ + sz - 0.16), V(TX + 1.5, 0.47, TZ + sz + 0.16)), tw); // one bench (south): YOU stands at the north edge
  b.add(boxGeo(V(TX - 1.55, TY, TZ - 0.5), V(TX + 1.55, TY + 0.004, TZ + 0.5)), lam("byCloth", () => ({ color: "#e86a5a" })));
  b.build(root);
  // dominoes: two lines along x on the table top, line A (front, z +0.12) and line B (back, z +0.44 from TZ - 0.16)
  const DW = 0.075, DH = 0.15, DT = 0.026, GAPX = 0.1, NA = 10, X0 = TX - 0.45;
  const domTex = ctex("domFace", 128, 256, (g) => { g.fillStyle = "#fbf8f0"; g.fillRect(0, 0, 128, 256); g.fillStyle = "#241726"; g.fillRect(8, 124, 112, 8); for (const [x, y] of [[40, 50], [88, 80], [64, 190], [40, 210], [88, 170]]) { g.beginPath(); g.arc(x, y, 12, 0, 6.3); g.fill(); } g.strokeStyle = "#241726"; g.lineWidth = 8; g.strokeRect(4, 4, 120, 248); });
  const domM = lam("byDomFace", () => ({ map: domTex }));
  const domSide = lam("byDomSide", () => ({ color: "#efe8da" }));
  const mkLine = (z: number) => Array.from({ length: NA }, (_, i) => {
    const g = new THREE.Group(); g.position.set(X0 + i * GAPX + DT / 2, TY + 0.004, TZ + z); root.add(g);
    const m = new THREE.Mesh(new THREE.BoxGeometry(DT, DH, DW).translate(-DT / 2, DH / 2, 0), [domM, domM, domSide, domSide, domSide, domSide]);
    m.castShadow = true; g.add(m); return g;
  });
  const lineA = mkLine(0.16), lineB = mkLine(-0.18);
  const PULL = [4, 5, 6];
  // the two flying balloons (3D, so they arc through the space)
  const balM = shiny("byBalFly", "#e8463a", 100);
  const bal1 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), balM), bal2 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), balM);
  bal1.castShadow = bal2.castShadow = true; root.add(bal1, bal2);
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.7, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#3a6a4a", transparent: true, opacity: 0 })); puddle.position.set(-1.2, 0.01, 1.3); root.add(puddle);
  const YOU: V3 = [-0.95, 0, 1.3], FRIEND: V3 = [1.05, 0, -0.2];   // 2.5 m apart, half of it in depth (bigger in the 9:16 frame)
  const handY = (who: V3) => [who[0], 1.25, who[2]] as V3;
  const marks: Record<string, V3> = { you: YOU, friend: FRIEND, bucket: BUCKET, table: [TX, TY, TZ], domStart: [X0, TY, TZ], domYou: [TX - 0.1, 0, TZ - 0.8], domA0: [X0, TY, TZ + 0.16], domB0: [X0, TY, TZ - 0.18], domPull: [X0 + 5 * GAPX, TY, TZ - 0.18], youHands: [YOU[0] + 0.32, 1.22, YOU[2] + 0.05], friendHand: [FRIEND[0] - 0.3, 1.55, FRIEND[2]] };
  const cams = { two: { pos: [0.4, 1.5, 6.0] as V3, look: [0.4, 1.1, 0.8] as V3, fov: 42 } };
  const arc = (k: number, from: V3, to: V3): V3 => [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k + 0.9 * Math.sin(Math.PI * k), from[2] + (to[2] - from[2]) * k];
  return {
    name: "backyard", root, marks, cams,
    pose: (t, c) => {
      const from = marks.friendHand, to = marks.youHands;
      const k1 = c.b1 ?? -1, k2 = c.b2 ?? -1, pop = Math.max(0, Math.min(1, c.b1pop ?? 0));
      bal1.visible = k1 >= 0 && pop < 1; if (bal1.visible) { bal1.position.set(...arc(Math.min(1, k1), from, to)); bal1.scale.setScalar(1 + 0.6 * pop); bal1.scale.y = (1 - 0.8 * pop); }
      bal2.visible = k2 >= 0 && k2 < 1; if (bal2.visible) { bal2.position.set(...arc(k2, from, to)); const sq = Math.sin(t * 14) * 0.08; bal2.scale.set(1 + sq, 1 - sq, 1 + sq); }
      (puddle.material as THREE.MeshBasicMaterial).opacity = 0.45 * Math.max(0, Math.min(1, c.wet ?? 0));
      laundry.forEach((m, i) => { m.rotation.x = 0.12 * Math.sin(t * 1.6 + i * 0.9); m.rotation.y = 0.08 * Math.sin(t * 1.1 + i); });
      tail.rotation.x = 0.4 + 0.35 * Math.sin(t * 2.2); tail.rotation.z = 0.25 * Math.sin(t * 1.3);
      // dominoes: c.domA / c.domB = wave front (domino index, fractional); a domino tips over its +x bottom edge and leans on the next
      const fallTo = (line: THREE.Group[], wave: number, gapAt: number[]) => line.forEach((g, i) => {
        const missing = gapAt.includes(i);
        g.visible = !missing;
        if (missing) return;
        const nextMissing = gapAt.includes(i + 1) || i === line.length - 1;
        const maxA = nextMissing ? Math.PI / 2 - 0.04 : 1.12;
        const k = Math.max(0, Math.min(1, wave - i));
        g.rotation.z = -maxA * (k * k * (3 - 2 * k));
      });
      const wa = c.domA ?? -1, wb = c.domB ?? -1, pulled = (c.pulled ?? 0) > 0.5;
      lineA.forEach((g) => (g.visible = (c.domA ?? -99) > -50));
      if (wa > -50) fallTo(lineA, wa, (c.placed ?? 1) < 0.5 ? [0] : []);
      if (wb > -50) { const stopAt = PULL[0] - 1; fallTo(lineB, Math.min(wb, pulled ? stopAt + 1 : 99), pulled ? PULL : []); } else lineB.forEach((g) => (g.visible = false));
      void handY;
    },
  };
};
