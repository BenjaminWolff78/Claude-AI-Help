// The base of the Eiffel Tower on the Champ de Mars, Paris, 1925 (title object of "The Man Who Sold the Eiffel
// Tower"). The tower stands at the origin (real profile x K = 0.55: base 69 m square, first platform y = 31.7, second
// 63.6, third 151.8, lantern top 165 + flagpole). Ground y = 0. +z is the Champ de Mars side (the drive, lawns, the
// park, the camera side of most shots); the Seine (Pont d'Iena, a barge) runs behind the tower at z -90..-168 with
// Haussmann Paris and a gilded dome on the far bank, more Haussmann rows along x = +-165.
//
// THE NEAR LEG is the pillar at (+x, +z): footprint x, z in 20.6..34.4 at the ground, leaning in (inner corner I(y),
// outer W(y), see towerkit.ts). Its four chords stand on stone piers (2.4 m, 1.1 high). Every leg is real 3D riveted
// lattice (corner chords = 4 angles + lacing, X-braced girder faces, gusset plates), LOD to plain bars beyond 90 m.
//  - the great decorative arches span between the legs in the planes |x| or |z| = 20 (spring y 7, crown 23);
//    the front arch (z = +20) is the hero arch behind the group.
//  - the visitors' stair climbs inside the near leg: flight 1 along -z at x 18.5..19.7 from the foot z 32 (y 0) to
//    landing 1 (y 7.0, x 18.3..19.9, z 22.2..24.0); flight 2 along +x (z 22.4..23.6) to landing 2 (y 12, x 25..26.4);
//    flight 3 back along -x (z 20.9..22.1) up to y 15.5. The near leg's inner (x = I) face has no bottom diagonals.
//  - the painters' plank hangs on ropes from two outriggers in front of the near leg's front (z = W) face:
//    plank top y 4.56, x 24..29, z 32.05..32.65, with paint pots at x 24.3 / 26.5 / 28.7.
//  - ticket kiosk (BILLETS) at (15, 0, 36.2) r 1.4; Morris column (-9, 0, 39.5); flower + balloon cart (3.5, 0, 22).
//  - gravel drive z 43..50 in front, limousine space centre (-4, 0, 46.5) 5 x 2 m along x; lawns with iron hoops
//    z 54..62; benches + lamp posts along the drive (never inside the car space).
// CONTROLS (pose c):  fair 0..1 = 1889 World's Fair dressing (bunting between the legs, tricolour flags on poles,
//   EXPOSITION 1889 banner in the front arch, tricolour swags on the frieze, festival stalls, fresh red-brown paint,
//   no rust; shown when fair > 0.5, paint blends continuously);  rust 0..1 (default 1 = the rusty 1925 look; forced
//   to 0 by fair);  glow 0..1 = payoff sunburst (gold rays + haze behind the tower, sparkles on it, warm sheen).
// AMBIENT: flags / pennants / banner flutter, chestnut crowns sway, pigeons circle the tower and the top, the plank
//   and its ropes swing a little, a bucket swings, balloons bob, a barge and a bateau-mouche move on the Seine.
// KEEP-OUT for cameras: TOWER_SOLIDS below (piers, chord segments of the 4 legs up to the first platform, the
//   stair + landings, kiosk, cart, Morris column, benches, lamp posts, tree trunks, the first-platform ring, bridge).
//   The leg faces between chords are lattice: pass only through the open bays, never through a diagonal.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { ctex, rng, stoneHD, grassHD, planksHD, cobbleHD } from "../paint";
import { NOINK } from "../ink";
import { glow, waterPlane, rod, sign } from "../setkit";
import { stall, flutterStall, sparkles, sparkle, fitText, stripeTex } from "./portkit_common";
import { leafTex } from "./innerkit_b";
import {
  Y1, Y2, Y3, YTOP, W, I, TAU, towerPaint, bar, girder, chordSeg, plate, gravelTex, hauss, domeChurch, bench, lampPost, hoops, morris,
  tree, swayTree, cloth, wave, bunting, flutter, pigeons, cart, barge, tricolourTex, bannerTex, burstTex, ironDark, type Tree, type Cloth, type Bunting,
} from "./towerkit";
import type { SetDef, V3 } from "./types";

type Corner = "O" | "A" | "B" | "N";
const corner = (sx: number, sz: number, y: number, c: Corner) => {
  const w = W(y), i = I(y);
  return c === "O" ? V(sx * w, y, sz * w) : c === "A" ? V(sx * i, y, sz * w) : c === "B" ? V(sx * w, y, sz * i) : V(sx * i, y, sz * i);
};
const NODES = [0.8, Y1 / 4, Y1 / 2, (3 * Y1) / 4, Y1, Y1 + (Y2 - Y1) / 3, Y1 + (2 * (Y2 - Y1)) / 3, Y2];
const FACES: [Corner, Corner, (sx: number, sz: number) => THREE.Vector3][] = [
  ["O", "A", (sx, sz) => V(0, 0, sz)], ["O", "B", (sx) => V(sx, 0, 0)], ["A", "N", (sx) => V(-sx, 0, 0)], ["B", "N", (sx, sz) => V(0, 0, -sz)],
];
const YTOPF = Y1 - 3.85, F1 = W(YTOPF) + 0.4, AP = F1 - 0.6; // frieze bottom, frieze outer half-size, arch plane
const ARCH = { ys: 7.0, ya: 23.0, e: 1.4 };
// stair (near leg)
const ST = { x0: 18.5, x1: 19.7, foot: 32.0, top: 24.0, rise: 0.2, n1: 35, L1: 7.0 };
const STR = (ST.foot - ST.top) / ST.n1;

const pavilionTex = () => ctex("twrPavilion", 1024, 320, (g, r) => {
  g.fillStyle = "#f2e6cc"; g.fillRect(0, 0, 1024, 320);
  for (let i = 0; i < 10; i++) { const x = r() * 1024, y = r() * 320, rr = 40 + r() * 70, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, "rgba(140,110,70,0.1)"); gr.addColorStop(1, "rgba(140,110,70,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  g.fillStyle = "#c9a26a"; g.fillRect(0, 0, 1024, 26); g.fillRect(0, 296, 1024, 24);
  for (let i = 0; i < 8; i++) {
    const cx = 64 + i * 128, top = 90, bot = 270, w = 72;
    g.fillStyle = "#f8f0de"; g.beginPath(); g.moveTo(cx - w / 2 - 10, bot + 8); g.lineTo(cx - w / 2 - 10, top); g.arc(cx, top, w / 2 + 10, Math.PI, 0); g.lineTo(cx + w / 2 + 10, bot + 8); g.closePath(); g.fill();
    const gl = g.createLinearGradient(0, top - 36, 0, bot); gl.addColorStop(0, "#ffd890"); gl.addColorStop(1, "#e8a050");
    g.fillStyle = i % 3 === 1 ? "#6a76b4" : gl; g.beginPath(); g.moveTo(cx - w / 2, bot); g.lineTo(cx - w / 2, top); g.arc(cx, top, w / 2, Math.PI, 0); g.lineTo(cx + w / 2, bot); g.closePath(); g.fill();
    g.strokeStyle = "#7a5a3a"; g.lineWidth = 3; g.stroke(); g.fillStyle = "#7a5a3a"; g.fillRect(cx - 2, top - 30, 4, bot - top + 30); g.fillRect(cx - w / 2, 180, w, 4);
    g.fillStyle = "#c8352e"; g.beginPath(); g.moveTo(cx - w / 2 - 12, top - 46); g.lineTo(cx + w / 2 + 12, top - 46); g.lineTo(cx + w / 2 + 4, top - 26); g.lineTo(cx - w / 2 - 4, top - 26); g.fill();
  }
});
const kioskTex = () => ctex("twrKiosk", 1024, 256, (g) => {
  for (let i = 0; i < 8; i++) {
    const x = i * 128; g.fillStyle = "#2f5a46"; g.fillRect(x, 0, 128, 256);
    g.strokeStyle = "#d9b04a"; g.lineWidth = 4; g.strokeRect(x + 10, 12, 108, 232);
    if (i === 0 || i === 2 || i === 6) {
      const gl = g.createLinearGradient(0, 40, 0, 170); gl.addColorStop(0, "#ffe2a0"); gl.addColorStop(1, "#f0a858");
      g.fillStyle = gl; g.beginPath(); g.moveTo(x + 22, 170); g.lineTo(x + 22, 70); g.arc(x + 64, 70, 42, Math.PI, 0); g.lineTo(x + 106, 170); g.closePath(); g.fill();
      g.strokeStyle = "#1f3a2e"; g.lineWidth = 5; g.stroke(); g.fillStyle = "#1f3a2e"; g.fillRect(x + 62, 30, 4, 140); g.fillRect(x + 22, 112, 84, 4);
      g.fillStyle = "#c79a3a"; g.fillRect(x + 16, 170, 96, 10);
    } else {
      g.fillStyle = "#f2e6c8"; g.fillRect(x + 24, 36, 80, 120);
      g.fillStyle = ["#c8352e", "#2a4aa6", "#e0a83a", "#2f6b4f", "#c8352e"][i % 5]; g.fillRect(x + 30, 44, 68, 50);
      g.fillStyle = "#3a2a20"; for (let k = 0; k < 4; k++) g.fillRect(x + 32, 104 + k * 12, 64 - k * 10, 5);
    }
    g.fillStyle = "#24463a"; g.fillRect(x + 14, 196, 100, 46); g.strokeStyle = "#d9b04a"; g.lineWidth = 2; g.strokeRect(x + 20, 202, 88, 34);
  }
});
const kioskSignTex = () => ctex("twrKioskSign", 1024, 96, (g) => {
  g.fillStyle = "#1f3a2e"; g.fillRect(0, 0, 1024, 96);
  const words = ["BILLETS", "", "ASCENSION", "", "BILLETS", "", "ASCENSION", ""];
  g.textAlign = "center"; g.textBaseline = "middle";
  words.forEach((w, i) => {
    const cx = i * 128 + 64; g.fillStyle = "#f2d27a";
    if (w) fitText(g, w, cx, 50, 112, 46, "900 %spx Georgia, serif"); else { g.beginPath(); g.arc(cx, 48, 9, 0, TAU); g.fill(); }
  });
  g.strokeStyle = "#d9b04a"; g.lineWidth = 4; g.strokeRect(2, 4, 1020, 88);
});
const swagTex = () => ctex("twrSwag", 512, 128, (g) => {
  const n = 4, w = 512 / n;
  for (let i = 0; i < n; i++) {
    const cx = i * w + w / 2;
    for (const [rr, c] of [[w / 2, "#d8352e"], [w / 2 - 10, "#f6f2ea"], [w / 2 - 20, "#2a4aa6"]] as [number, string][]) { g.fillStyle = c; g.beginPath(); g.moveTo(cx - rr, 0); g.arc(cx, 0, rr, 0, Math.PI); g.closePath(); g.fill(); }
    g.fillStyle = "#e0b04a"; g.beginPath(); g.arc(i * w, 6, 9, 0, TAU); g.fill();
  }
});

export const TOWER_SOLIDS: [V3, V3][] = [];

export const tower = (): SetDef => {
  const root = new THREE.Group(), b = new Batch(), P = towerPaint();
  const solid = (a: V3, c: V3) => TOWER_SOLIDS.push([[Math.min(a[0], c[0]), Math.min(a[1], c[1]), Math.min(a[2], c[2])], [Math.max(a[0], c[0]), Math.max(a[1], c[1]), Math.max(a[2], c[2])]]);
  TOWER_SOLIDS.length = 0;
  const stone = lam("twrPierStone", () => ({ map: stoneHD("twrPierHD", ["#e2d6c0", "#d6c9b0", "#ebe0cc", "#cfc0a6"], "#a8977e") }));

  // =============== THE TOWER ===============
  // ---- legs (LOD: lattice near, plain bars far) ----
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const near = sx === 1 && sz === 1;
    for (const part of [0, 1]) {
      const j0 = part === 0 ? 0 : 4, j1 = part === 0 ? 4 : 7, cy = part === 0 ? 14 : 47;
      const lod = new THREE.LOD(), cw = W(cy) - (W(cy) - I(cy)) / 2; lod.position.set(sx * cw, cy, sz * cw); root.add(lod);
      for (const det of [1, 0]) {
        const lb = new Batch(), g = new THREE.Group(); g.position.set(-sx * cw, -cy, -sz * cw);
        for (let j = j0; j < j1; j++) {
          const y0 = NODES[j], y1 = NODES[j + 1], cs = part === 0 ? 1.5 : 1.2;
          for (const c of ["O", "A", "B", "N"] as Corner[]) {
            const a = corner(sx, sz, y0, c), e = corner(sx, sz, y1, c), out = V(c === "O" || c === "B" ? sx : -sx, 0, c === "O" || c === "A" ? sz : -sz);
            chordSeg(lb, a, e, cs, P, det, out);
            if (det && j < 4) solid([a.x - cs / 2, a.y, a.z - cs / 2], [e.x + cs / 2, e.y, e.z + cs / 2]);
          }
          for (const [c0, c1, nf] of FACES) {
            const p0 = corner(sx, sz, y0, c0), p1 = corner(sx, sz, y0, c1), p2 = corner(sx, sz, y1, c1), p3 = corner(sx, sz, y1, c0);
            const hint = nf(sx, sz), n = p1.clone().sub(p0).cross(p3.clone().sub(p0)).normalize(); if (n.dot(hint) < 0) n.negate();
            const stairBay = near && c0 === "A" && c1 === "N" && j === 0;
            const dd = det ? 1 : 0, dw = part === 0 ? 1.1 : 0.9;
            if (!stairBay) { girder(lb, p0, p2, dw, 0.45, n, P, dd); girder(lb, p1, p3, dw, 0.45, n, P, dd); }
            if (!stairBay) girder(lb, p3, p2, part === 0 ? 0.9 : 0.75, 0.5, n, P, det ? 1 : 0);
            if (j === 0) girder(lb, p0.clone().setY(1.6), p1.clone().setY(1.6), 0.7, 0.45, n, P, det ? 1 : 0);
            if (det && j < 4) {
              const mid = p0.clone().add(p1).add(p2).add(p3).multiplyScalar(0.25);
              if (!stairBay) plate(lb, mid, n, 1.15, 0.26, P);
              for (const q of [p3, p2]) plate(lb, q, n, 1.5, cs / 2 + 0.04, P);
            }
          }
        }
        lb.build(g); lod.addLevel(g, det ? 0 : 90);
      }
    }
    // stone piers under the four chord feet
    for (const c of ["O", "A", "B", "N"] as Corner[]) {
      const p = corner(sx, sz, 0, c);
      b.add(boxGeo(V(p.x - 1.2, 0, p.z - 1.2), V(p.x + 1.2, 1.1, p.z + 1.2), 1.5), stone);
      b.add(boxGeo(V(p.x - 1.32, 1.1, p.z - 1.32), V(p.x + 1.32, 1.26, p.z + 1.32), 1.5), lam("twrPierCap", () => ({ color: "#efe6d4" })));
      solid([p.x - 1.32, 0, p.z - 1.32], [p.x + 1.32, 1.3, p.z + 1.32]);
    }
  }

  // ---- the four great arches (in the planes |x| or |z| = AP) + spandrel lattice up to the frieze ----
  const ab = new Batch();
  for (let side = 0; side < 4; side++) {
    const rot = new THREE.Matrix4().makeRotationY((side * Math.PI) / 2);
    const T = (x: number, y: number, z = AP) => V(x, y, z).applyMatrix4(rot), n = V(0, 0, 1).applyMatrix4(rot);
    const a = I(ARCH.ys) + 0.3, bb = ARCH.ya - ARCH.ys, e = ARCH.e, N = 30;
    const pin = (k: number) => { const th = (k / N) * Math.PI; return T(a * Math.cos(th), ARCH.ys + bb * Math.sin(th)); };
    const pout = (k: number) => { const th = (k / N) * Math.PI; return T((a + e) * Math.cos(th), ARCH.ys + (bb + e) * Math.sin(th)); };
    for (let k = 0; k < N; k++) {
      bar(ab, pin(k), pin(k + 1), 0.42, 0.7, n, P.main); bar(ab, pout(k), pout(k + 1), 0.42, 0.7, n, P.main);
      bar(ab, pin(k), pout(k), 0.16, 0.45, n, P.lace); bar(ab, pin(k), pout(k + 1), 0.12, 0.4, n, P.lace);
    }
    const extY = (x: number) => ARCH.ys + (bb + e) * Math.sin(Math.acos(Math.min(1, Math.abs(x) / (a + e))));
    const posts = [-9.2, -7.4, -5.6, -3.8, -1.9, 0, 1.9, 3.8, 5.6, 7.4, 9.2];
    posts.forEach((x, i) => {
      bar(ab, T(x, extY(x) - 0.2), T(x, YTOPF), 0.22, 0.5, n, P.main);
      if (i < posts.length - 1) {
        const x2 = posts[i + 1];
        bar(ab, T(x, extY(x)), T(x2, YTOPF), 0.12, 0.4, n, P.lace); bar(ab, T(x2, extY(x2)), T(x, YTOPF), 0.12, 0.4, n, P.lace);
      }
    });
    bar(ab, T(-F1 + 0.6, YTOPF - 0.2), T(F1 - 0.6, YTOPF - 0.2), 0.5, 0.7, n, P.main);
    for (const sx of [-1, 1]) {
      const x = sx * 8.3, y0 = extY(x), rr = (YTOPF - y0) * 0.34, c = T(x, (y0 + YTOPF) / 2);
      const ring = new THREE.TorusGeometry(rr, 0.13, 6, 24); ring.applyMatrix4(rot); ring.translate(c.x, c.y, c.z); ab.add(ring, P.main);
      const ring2 = new THREE.TorusGeometry(rr * 0.55, 0.09, 6, 18); ring2.applyMatrix4(rot); ring2.translate(c.x, c.y, c.z); ab.add(ring2, P.lace);
    }
  }
  ab.build(root);

  // ---- first platform: deck ring, frieze, lambrequin, gallery railing, restaurant pavilions ----
  const I1 = I(Y1);
  const ringBoxes: [number, number, number, number][] = [[-F1, F1, I1, F1], [-F1, F1, -F1, -I1], [-F1, -I1, -I1, I1], [I1, F1, -I1, I1]];
  for (const [x0, x1, z0, z1] of ringBoxes) { b.add(boxGeo(V(x0, Y1 - 0.5, z0), V(x1, Y1, z1), 3), lam("twrDeck", () => ({ map: planksHD(), color: "#b89a84" }))); solid([x0, YTOPF - 1, z0], [x1, Y1 + 1.2, z1]); }
  const fz = P.frieze;
  for (let s = 0; s < 4; s++) {
    const rot = new THREE.Matrix4().makeRotationY((s * Math.PI) / 2);
    const g1 = boxGeo(V(-F1, YTOPF, F1 - 1.0), V(F1, Y1 + 0.3, F1), 0); const uv = g1.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (2 * F1) / 8);
    b.add(g1, fz, rot);
    b.add(boxGeo(V(-F1 - 0.25, Y1 + 0.3, F1 - 1.1), V(F1 + 0.25, Y1 + 0.55, F1 + 0.25)), P.main, rot);
    const lq = quad(V(-F1, YTOPF - 0.95, F1 + 0.02), V(F1, YTOPF - 0.95, F1 + 0.02), V(F1, YTOPF, F1 + 0.02), V(-F1, YTOPF, F1 + 0.02), (2 * F1) / 4, 1); b.add(lq, P.trims[0], rot);
    const rl = quad(V(-F1 + 0.3, Y1 + 0.55, F1 - 0.4), V(F1 - 0.3, Y1 + 0.55, F1 - 0.4), V(F1 - 0.3, Y1 + 1.7, F1 - 0.4), V(-F1 + 0.3, Y1 + 1.7, F1 - 0.4), (2 * F1) / 4, 1); b.add(rl, P.trims[1], rot);
    b.add(boxGeo(V(-F1 + 0.3, Y1 + 1.66, F1 - 0.47), V(F1 - 0.3, Y1 + 1.76, F1 - 0.33)), P.main, rot);
    // inner frieze round the central opening
    b.add(boxGeo(V(-I1 - 0.6, Y1 - 1.8, I1), V(I1 + 0.6, Y1 + 0.3, I1 + 0.6), 0), fz, rot);
    // pavilion (restaurant) with a hipped slate roof
    const pv = lam("twrPavM", () => ({ map: pavilionTex() })), pr = lam("twrPavRoof", () => ({ map: stripeTex("#6f7c92", "#7d8aa0", 16) }));
    const px = 6.6, pz0 = I1 + 2.6, pz1 = F1 - 1.6, ph = 4.0, py = Y1;
    b.add(quad(V(-px, py, pz1), V(px, py, pz1), V(px, py + ph, pz1), V(-px, py + ph, pz1)), pv, rot);
    b.add(quad(V(px, py, pz0), V(-px, py, pz0), V(-px, py + ph, pz0), V(px, py + ph, pz0)), pv, rot);
    b.add(quad(V(-px, py, pz0), V(-px, py, pz1), V(-px, py + ph, pz1), V(-px, py + ph, pz0), 0.4, 1), pv, rot);
    b.add(quad(V(px, py, pz1), V(px, py, pz0), V(px, py + ph, pz0), V(px, py + ph, pz1), 0.4, 1), pv, rot);
    const ry = py + ph, rh = 2.2, ov = 0.4, rc = (pz0 + pz1) / 2;
    b.add(quad(V(-px - ov, ry, pz1 + ov), V(px + ov, ry, pz1 + ov), V(px - 1.5, ry + rh, rc), V(-px + 1.5, ry + rh, rc)), pr, rot);
    b.add(quad(V(px + ov, ry, pz0 - ov), V(-px - ov, ry, pz0 - ov), V(-px + 1.5, ry + rh, rc), V(px - 1.5, ry + rh, rc)), pr, rot);
    b.add(quad(V(-px - ov, ry, pz0 - ov), V(-px - ov, ry, pz1 + ov), V(-px + 1.5, ry + rh, rc), V(-px + 1.5, ry + rh, rc)), pr, rot);
    b.add(quad(V(px + ov, ry, pz1 + ov), V(px + ov, ry, pz0 - ov), V(px - 1.5, ry + rh, rc), V(px - 1.5, ry + rh, rc)), pr, rot);
    for (const gx of [-4.2, 0, 4.2]) glow(root, V(gx, py + 1.8, pz1 + 0.3).applyMatrix4(rot).toArray() as V3, "#ffc070", 2.0, 0.3);
  }

  // ---- shaft above the second floor ----
  const sb = new Batch(), snodes: number[] = [Y2];
  while (snodes[snodes.length - 1] < Y3 - 0.5) { const y = snodes[snodes.length - 1]; snodes.push(Math.min(Y3, y + Math.max(5.5, 1.55 * W(y)))); }
  if (Y3 - snodes[snodes.length - 2] < 4) snodes.splice(snodes.length - 2, 1);
  const SC = (sx: number, sz: number, y: number) => V(sx * W(y), y, sz * W(y));
  for (let j = 0; j < snodes.length - 1; j++) {
    const y0 = snodes[j], y1 = snodes[j + 1], cs = 0.45 + 0.06 * W(y0), dw = 0.25 + 0.035 * W(y0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bar(sb, SC(sx, sz, y0), SC(sx, sz, y1), cs, cs, V(sx, 0, sz).normalize(), P.main, 4);
    for (let s = 0; s < 4; s++) {
      const rot = new THREE.Matrix4().makeRotationY((s * Math.PI) / 2), n = V(0, 0, 1).applyMatrix4(rot);
      const p0 = SC(-1, 1, y0).applyMatrix4(rot), p1 = SC(1, 1, y0).applyMatrix4(rot), p2 = SC(1, 1, y1).applyMatrix4(rot), p3 = SC(-1, 1, y1).applyMatrix4(rot);
      bar(sb, p0, p2, dw, dw * 0.8, n, P.main); bar(sb, p1, p3, dw, dw * 0.8, n, P.main); bar(sb, p3, p2, dw * 0.9, dw * 0.8, n, P.main);
      bar(sb, p0.clone().lerp(p3, 0.5), p1.clone().lerp(p2, 0.5), dw * 0.5, dw * 0.5, n, P.lace);
      if (W(y0) > 6) { // secondary X in the two half bays
        const m0 = p0.clone().lerp(p1, 0.5), m1 = p3.clone().lerp(p2, 0.5);
        bar(sb, m0, m1, dw * 0.45, dw * 0.45, n, P.lace);
      }
    }
  }
  // the legs' inner chords meet the shaft: second-floor deck, frieze, railing
  const F2 = W(Y2 - 2.2) + 0.3;
  sb.add(boxGeo(V(-F2, Y2 - 0.45, -F2), V(F2, Y2, F2), 3), lam("twrDeck", () => ({ map: planksHD(), color: "#b89a84" })));
  for (let s = 0; s < 4; s++) {
    const rot = new THREE.Matrix4().makeRotationY((s * Math.PI) / 2);
    const g2 = boxGeo(V(-F2, Y2 - 2.2, F2 - 0.7), V(F2, Y2 + 0.25, F2), 0); const uv = g2.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (2 * F2) / 8);
    sb.add(g2, fz, rot);
    sb.add(quad(V(-F2, Y2 - 2.9, F2 + 0.02), V(F2, Y2 - 2.9, F2 + 0.02), V(F2, Y2 - 2.2, F2 + 0.02), V(-F2, Y2 - 2.2, F2 + 0.02), (2 * F2) / 4, 1), P.trims[0], rot);
    sb.add(quad(V(-F2 + 0.2, Y2 + 0.25, F2 - 0.3), V(F2 - 0.2, Y2 + 0.25, F2 - 0.3), V(F2 - 0.2, Y2 + 1.4, F2 - 0.3), V(-F2 + 0.2, Y2 + 1.4, F2 - 0.3), (2 * F2) / 4, 1), P.trims[1], rot);
  }
  // third floor gallery, campanile, lantern, dome, flagpole
  const F3 = W(Y3) + 1.0;
  sb.add(boxGeo(V(-F3, Y3 - 0.6, -F3), V(F3, Y3, F3)), P.main);
  sb.add(boxGeo(V(-F3 + 0.3, Y3, -F3 + 0.3), V(F3 - 0.3, Y3 + 2.8, F3 - 0.3), 0), lam("twrGallery", () => ({ map: pavilionTex() })));
  sb.add(boxGeo(V(-F3 - 0.3, Y3 + 2.8, -F3 - 0.3), V(F3 + 0.3, Y3 + 3.2, F3 + 0.3)), P.main);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bar(sb, V(sx * 2.4, Y3 + 3.2, sz * 2.4), V(sx * 1.5, Y3 + 8.8, sz * 1.5), 0.4, 0.4, V(sx, 0, sz), P.main);
  for (let s = 0; s < 4; s++) {
    const rot = new THREE.Matrix4().makeRotationY((s * Math.PI) / 2);
    const arc = new THREE.TorusGeometry(1.7, 0.16, 6, 16, Math.PI); arc.translate(0, Y3 + 5.6, 2.0); arc.applyMatrix4(rot); sb.add(arc, P.main);
  }
  sb.add(boxGeo(V(-1.9, Y3 + 8.8, -1.9), V(1.9, Y3 + 9.3, 1.9)), P.main);
  sb.add(new THREE.CylinderGeometry(1.3, 1.5, 2.6, 12).translate(0, Y3 + 10.6, 0), P.main);
  sb.add(new THREE.SphereGeometry(1.45, 16, 8, 0, TAU, 0, Math.PI / 2).translate(0, Y3 + 11.9, 0), P.main);
  sb.add(new THREE.CylinderGeometry(0.09, 0.12, 9, 6).translate(0, YTOP + 3.5, 0), ironDark());
  sb.build(root);
  const topFlag = cloth(root, 5.0, 3.3, lam("twrFlagM", () => ({ map: tricolourTex(), side: THREE.DoubleSide })), 0.35, 1.3);
  topFlag.m.position.set(0.1, YTOP + 7.8, 0);

  // =============== STAIR inside the near leg ===============
  const iron = lam("twrTread", () => ({ color: "#4e3a32" }));
  const stb = new Batch();
  const flight = (foot: THREE.Vector3, dir: THREE.Vector3, n: number, run: number, w: number, y0: number) => {
    const side = V(-dir.z, 0, dir.x), yaw = Math.atan2(dir.x, dir.z);
    for (let i = 0; i < n; i++) {
      const c = foot.clone().addScaledVector(dir, (i + 0.5) * run).setY(y0 + (i + 1) * ST.rise - 0.03);
      stb.add(new THREE.BoxGeometry(w, 0.06, run + 0.04).rotateY(yaw).translate(c.x, c.y, c.z), iron);
    }
    const top = foot.clone().addScaledVector(dir, n * run).setY(y0 + n * ST.rise), bot = foot.clone().setY(y0);
    for (const s of [-1, 1]) {
      const o = side.clone().multiplyScalar((s * (w + 0.1)) / 2);
      bar(stb, bot.clone().add(o).add(V(0, -0.1, 0)), top.clone().add(o).add(V(0, -0.1, 0)), 0.07, 0.32, side, P.main, 2);
      bar(stb, bot.clone().add(o).add(V(0, 1.0, 0)), top.clone().add(o).add(V(0, 1.0, 0)), 0.06, 0.06, side, P.main, 2);
      bar(stb, bot.clone().add(o).add(V(0, 0.5, 0)), top.clone().add(o).add(V(0, 0.5, 0)), 0.03, 0.03, side, P.lace, 2);
      const m = Math.ceil((n * run) / 1.1);
      for (let k = 0; k <= m; k++) { const p = bot.clone().lerp(top, k / m).add(o); bar(stb, p.clone().add(V(0, -0.1, 0)), p.clone().add(V(0, 1.0, 0)), 0.05, 0.05, side, P.main, 2); }
    }
    return top;
  };
  const landing = (x0: number, x1: number, z0: number, z1: number, y: number, rails: [V3, V3][]) => {
    stb.add(boxGeo(V(x0, y - 0.12, z0), V(x1, y, z1), 1), iron);
    bar(stb, V(x0, y - 0.35, z0), V(x1, y - 0.35, z0), 0.12, 0.25, V(0, 0, 1), P.main); bar(stb, V(x0, y - 0.35, z1), V(x1, y - 0.35, z1), 0.12, 0.25, V(0, 0, 1), P.main);
    for (const [a, c] of rails) { const A = V(...a).setY(y), C = V(...c).setY(y); bar(stb, A.clone().add(V(0, 1.0, 0)), C.clone().add(V(0, 1.0, 0)), 0.06, 0.06, V(0, 1, 0), P.main); bar(stb, A, A.clone().add(V(0, 1.0, 0)), 0.05, 0.05, V(1, 0, 0), P.main); bar(stb, C, C.clone().add(V(0, 1.0, 0)), 0.05, 0.05, V(1, 0, 0), P.main); bar(stb, A.clone().add(V(0, 0.5, 0)), C.clone().add(V(0, 0.5, 0)), 0.03, 0.03, V(0, 1, 0), P.lace); }
    solid([x0, y - 0.4, z0], [x1, y + 1.05, z1]);
  };
  const SX = (ST.x0 + ST.x1) / 2, SW = ST.x1 - ST.x0;
  flight(V(SX, 0, ST.foot), V(0, 0, -1), ST.n1, STR, SW, 0);
  solid([ST.x0 - 0.1, 0, ST.top], [ST.x1 + 0.1, ST.L1 + 1.05, ST.foot]);
  landing(18.3, 19.9, 22.2, 24.0, ST.L1, [[[18.3, 0, 22.2], [18.3, 0, 24.0]], [[18.3, 0, 22.2], [19.9, 0, 22.2]]]);
  const run2 = (25.0 - 19.9) / 25;
  flight(V(19.9, ST.L1, 23.0), V(1, 0, 0), 25, run2, 1.2, ST.L1);
  solid([19.9, ST.L1, 22.3], [25.0, 13.05, 23.7]);
  landing(25.0, 26.4, 20.9, 23.6, 12.0, [[[26.4, 0, 20.9], [26.4, 0, 23.6]], [[25.0, 0, 23.6], [26.4, 0, 23.6]]]);
  const run3 = (25.0 - 21.5) / 18;
  flight(V(25.0, 12, 21.5), V(-1, 0, 0), 18, run3, 1.2, 12);
  landing(20.3, 21.5, 20.9, 22.1, 15.6, [[[20.3, 0, 20.9], [20.3, 0, 22.1]]]);
  // supports
  for (const [x, z, y] of [[18.45, 28, 3.2], [19.75, 28, 3.2], [18.4, 24.0, ST.L1], [19.8, 24.0, ST.L1], [18.4, 22.25, ST.L1], [19.8, 22.25, ST.L1], [25.1, 21.0, 12], [26.3, 21.0, 12], [25.1, 23.5, 12], [26.3, 23.5, 12], [20.4, 21.0, 15.6], [20.4, 22.0, 15.6]] as V3[]) bar(stb, V(x, 0, z), V(x, y - 0.12, z), 0.12, 0.12, V(1, 0, 0), P.main, 3);
  for (const [a, c] of [[[18.4, 0.3, 24.0], [18.4, 6.5, 22.25]], [[19.8, 0.3, 22.25], [19.8, 6.5, 24.0]], [[25.1, 0.3, 21.0], [25.1, 11.5, 23.5]], [[26.3, 0.3, 23.5], [26.3, 11.5, 21.0]]] as [V3, V3][]) bar(stb, V(...a), V(...c), 0.07, 0.07, V(1, 0, 0), P.lace, 3);
  stb.build(root);
  const stepY = (i: number) => (i + 1) * ST.rise, stepZ = (i: number) => ST.foot - (i + 0.5) * STR;

  // =============== PAINTERS' PLANK on the near leg's front face ===============
  const PZ = 32.35, PY = 4.56, PX0 = 24.0, PX1 = 29.0, OY = 11.0;
  for (const x of [24.3, 28.7]) {
    bar(b, V(x, OY, W(OY) - 0.3), V(x, OY, PZ + 0.45), 0.22, 0.26, V(1, 0, 0), lam("twrOutrigger", () => ({ map: planksHD(), color: "#c8a07a" })), 2);
    bar(b, V(x, 8.0, W(8.0) - 0.1), V(x, OY - 0.1, PZ + 0.3), 0.12, 0.12, V(1, 0, 0), lam("twrOutrigger", () => ({ map: planksHD(), color: "#c8a07a" })), 2);
  }
  const plankG = new THREE.Group(); plankG.position.set((PX0 + PX1) / 2, OY, PZ); root.add(plankG);
  const pb = new Batch(), rope = lam("twrRope", () => ({ color: "#d8c8a0" })), wood = lam("twrPlankWood", () => ({ map: planksHD(), color: "#f0d0a8" }));
  pb.add(boxGeo(V(PX0 - 26.5, PY - OY - 0.09, -0.31), V(PX1 - 26.5, PY - OY, 0.31), 1.5), wood);
  for (const x of [PX0 - 26.5 + 0.2, PX1 - 26.5 - 0.2]) {
    pb.add(new THREE.CylinderGeometry(0.025, 0.025, OY - PY + 0.1, 5).translate(x, (PY - OY) / 2, 0), rope);
    pb.add(boxGeo(V(x - 0.08, PY - OY - 0.2, -0.36), V(x + 0.08, PY - OY - 0.08, 0.36)), wood);
    pb.add(new THREE.CylinderGeometry(0.02, 0.02, 0.75, 5).rotateX(Math.PI / 2).translate(x, PY - OY - 0.13, 0), rope);
  }
  const potM = lam("twrPot", () => ({ color: "#b8bcc4" })), brownPaint = lam("twrPotPaint", () => ({ color: "#6a4532" }));
  for (const x of [24.3, 26.5, 28.7]) {
    const lx = x - 26.5;
    pb.add(new THREE.CylinderGeometry(0.15, 0.13, 0.3, 12).translate(lx, PY - OY + 0.15, -0.1), potM);
    pb.add(new THREE.CylinderGeometry(0.135, 0.135, 0.02, 12).translate(lx, PY - OY + 0.29, -0.1), brownPaint);
    pb.add(new THREE.TorusGeometry(0.15, 0.012, 4, 10, Math.PI).translate(lx, PY - OY + 0.3, -0.1), ironDark());
    pb.add(new THREE.BoxGeometry(0.05, 0.36, 0.03).rotateZ(0.35).translate(lx + 0.06, PY - OY + 0.4, -0.1), lam("twrBrush", () => ({ color: "#c89a5a" })));
  }
  pb.add(new THREE.BoxGeometry(0.4, 0.12, 0.25).translate(PX1 - 26.5 - 0.7, PY - OY + 0.06, 0.15), lam("twrRag", () => ({ color: "#e8dcc4" })));
  pb.build(plankG);
  const bucketG = new THREE.Group(); bucketG.position.set(PX1 - 26.5 - 0.15, PY - OY - 0.1, 0.3); plankG.add(bucketG);
  { const rr = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.6, 4).translate(0, -0.8, 0), rope); bucketG.add(rr); const bk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.3, 12).translate(0, -1.75, 0), potM); bk.castShadow = true; bucketG.add(bk); }
  const dangle = new THREE.Group(); dangle.position.set(PX0 - 26.5 + 0.2, PY - OY - 0.1, 0); plankG.add(dangle);
  { const rr = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 4).translate(0, -1.2, 0), rope); dangle.add(rr); }
  solid([PX0, PY - 0.25, PZ - 0.35], [PX1, PY, PZ + 0.35]);

  // =============== GROUND ===============
  const gravel = lam("twrGravelM", () => ({ map: gravelTex() })), lawn = lam("twrLawn", () => ({ map: grassHD() }));
  const G = (x0: number, x1: number, z0: number, z1: number, m: THREE.Material, y = 0, t = 4) => b.add(quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), (x1 - x0) / t, (z1 - z0) / t), m);
  G(-130, 130, -86, 70, gravel);
  G(-900, 900, 70, 900, lawn, -0.01, 6); G(-900, -130, -86, 70, lawn, -0.01, 6); G(130, 900, -86, 70, lawn, -0.01, 6);
  const curb = lam("twrCurb", () => ({ color: "#e6dcc6" }));
  const lawnBed = (x0: number, x1: number, z0: number, z1: number, edge = true) => {
    G(x0, x1, z0, z1, lawn, 0.03);
    for (const [a, c] of [[[x0, z0], [x1, z0]], [[x0, z1], [x1, z1]]] as [number[], number[]][]) b.add(boxGeo(V(a[0], 0, a[1] - 0.08), V(c[0], 0.07, c[1] + 0.08)), curb);
    for (const x of [x0, x1]) b.add(boxGeo(V(x - 0.08, 0, z0), V(x + 0.08, 0.07, z1)), curb);
    if (edge) { hoops(b, [x0 + 0.3, 0, z0 + 0.25], [x1 - 0.3, 0, z0 + 0.25]); hoops(b, [x0 + 0.3, 0, z1 - 0.25], [x1 - 0.3, 0, z1 - 0.25]); }
  };
  lawnBed(-40, -6, 54, 62); lawnBed(6, 40, 54, 62);
  lawnBed(-40, -6, 66, 100, false); lawnBed(6, 40, 66, 100, false); lawnBed(-40, -6, 104, 200, false); lawnBed(6, 40, 104, 200, false);
  lawnBed(46, 100, -60, 48, false); lawnBed(-100, -46, -60, 48, false); lawnBed(-60, -12, -78, -50, false); lawnBed(12, 60, -78, -50, false);
  // flower beds at the lawn ends
  const flowerM = lam("twrFlowerBed", () => ({ map: ctex("twrFlowers", 512, 512, (g, r) => { g.fillStyle = "#4f8a3a"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 900; i++) { g.fillStyle = ["#e8455a", "#f4d24a", "#f7f3e8", "#e86aa8", "#c8352e"][Math.floor(r() * 5)]; g.beginPath(); g.arc(r() * 512, r() * 512, 4 + r() * 5, 0, TAU); g.fill(); } }) }));
  for (const x of [-37, 9]) { b.add(boxGeo(V(x, 0, 55), V(x + 28, 0.28, 61), 2), flowerM); }
  // gravel drive edge stones
  for (const z of [42.8, 50.2]) b.add(boxGeo(V(-90, 0, z - 0.1), V(90, 0.06, z + 0.1)), curb);

  // =============== PROPS ===============
  // kiosk
  const KX = 15.0, KZ = 36.2, kg = new THREE.Group(); kg.position.set(KX, 0, KZ); kg.rotation.y = 0.35; root.add(kg);
  { const kb = new Batch(), green = lam("twrKioskGreen", () => ({ color: "#2f5a46" })), zinc = lam("twrKioskZinc", () => ({ color: "#8f9aa6" })), gold = lam("twrGold", () => ({ color: "#eec258" }));
    kb.add(new THREE.CylinderGeometry(1.45, 1.5, 0.3, 8).rotateY(-Math.PI / 8).translate(0, 0.15, 0), stone);
    kb.add(new THREE.CylinderGeometry(1.25, 1.25, 2.4, 8, 1, true).rotateY(-Math.PI / 8).translate(0, 1.5, 0), lam("twrKioskWall", () => ({ map: kioskTex() })));
    kb.add(new THREE.CylinderGeometry(1.45, 1.3, 0.22, 8).rotateY(-Math.PI / 8).translate(0, 2.8, 0), green);
    kb.add(new THREE.CylinderGeometry(1.36, 1.36, 0.5, 8, 1, true).rotateY(-Math.PI / 8).translate(0, 3.15, 0), lam("twrKioskSignM", () => ({ map: kioskSignTex() })));
    kb.add(new THREE.CylinderGeometry(1.55, 1.42, 0.14, 8).rotateY(-Math.PI / 8).translate(0, 3.45, 0), green);
    kb.add(new THREE.SphereGeometry(1.45, 8, 6, 0, TAU, 0, Math.PI / 2).rotateY(-Math.PI / 8).scale(1, 0.85, 1).translate(0, 3.5, 0), zinc);
    kb.add(new THREE.SphereGeometry(0.16, 10, 8).translate(0, 4.8, 0), gold); kb.add(new THREE.ConeGeometry(0.05, 0.6, 6).translate(0, 5.15, 0), gold);
    kb.add(boxGeo(V(-0.55, 1.1, 1.22), V(0.55, 1.16, 1.5)), lam("twrKioskSill", () => ({ map: planksHD() })));
    kb.build(kg);
    const kl = new THREE.PointLight("#ffb860", 4, 7, 1.4); kl.position.set(0, 1.8, 1.8); kg.add(kl);
    glow(kg, [0, 1.6, 1.3], "#ffc070", 1.6, 0.45);
  }
  solid([KX - 1.6, 0, KZ - 1.6], [KX + 1.6, 5.3, KZ + 1.6]);
  // ticket queue posts + rope by the stair foot
  const brass = lam("twrBrass", () => ({ color: "#d9a940" }));
  for (const [x, z] of [[17.6, 33.2], [17.6, 34.8], [20.1, 36.2]]) { b.add(new THREE.CylinderGeometry(0.04, 0.05, 0.95, 8).translate(x, 0.47, z), brass); b.add(new THREE.SphereGeometry(0.07, 8, 6).translate(x, 0.98, z), brass); b.add(new THREE.CylinderGeometry(0.14, 0.16, 0.05, 10).translate(x, 0.02, z), brass); }
  const velvet = lam("twrVelvet", () => ({ color: "#a8283a" }));
  rod(root, [17.6, 0.85, 33.2], [17.6, 0.85, 34.8], 0.025, velvet);
  sign(root, "ESCALIER", 1.3, 0.34, [16.9, 2.3, 32.4], 0.45, "#2f5a46", "#f2d27a");
  rod(root, [16.9, 0, 32.35], [16.9, 2.15, 32.35], 0.04, ironDark());
  solid([16.2, 0, 32.0], [17.6, 2.6, 32.8]);
  morris(b, -9, 39.5); solid([-9.8, 0, 38.7], [-8.2, 3.9, 40.3]);
  const balloons = cart(b, root, 3.5, 22.0, -0.5); solid([2.0, 0, 20.6], [5.1, 3.0, 23.4]);
  const benches: [number, number, number][] = [[-26, 51.6, Math.PI], [-16, 51.6, Math.PI], [16, 51.6, Math.PI], [26, 51.6, Math.PI], [-6, 14, 0], [-12, 10, 0.5], [30, 41.5, Math.PI]];
  for (const [x, z, yaw] of benches) { bench(b, x, z, yaw); solid([x - 1.0, 0, z - 0.4], [x + 1.0, 1.0, z + 0.4]); }
  const lampGlows: THREE.Sprite[] = [];
  for (const [x, z] of [[-32, 42.2], [-18, 42.2], [-4, 42.2], [20, 42.2], [34, 42.2], [-24, 51.0], [-10, 51.0], [12, 51.0], [24, 51.0], [40, 51.0]]) { lampGlows.push(lampPost(b, root, x, z)); solid([x - 0.3, 0, z - 0.3], [x + 0.3, 5.2, z + 0.3]); }
  // trees (near ones sway)
  const trees: Tree[] = [];
  const tr = rng(5);
  for (let i = 0; i < 26; i++) {
    const side = i % 2 ? 1 : -1, x = side * (50 + (i % 4) * 9 + tr() * 3), z = -50 + Math.floor(i / 2) * 8 + tr() * 3;
    trees.push(tree(b, root, x, z, 9 + tr() * 3, i)); solid([x - 0.6, 0, z - 0.6], [x + 0.6, 6, z + 0.6]);
  }
  for (let i = 0; i < 12; i++) { const side = i % 2 ? 1 : -1, x = side * (46 + tr() * 4), z = 66 + Math.floor(i / 2) * 11; trees.push(tree(b, root, x, z, 10 + tr() * 2, 40 + i)); }
  // far tree rows (static, low poly)
  const fb = new Batch(), fleaf = lam("twrLeafFar", () => ({ map: leafTex("twrFar", "#5a9444", "#78ae56", "#3f7436") })), fbark = lam("twrBark", () => ({ color: "#6e5040" }));
  const farTree = (x: number, z: number, h: number, s: number) => { const r = rng(s); fb.add(new THREE.CylinderGeometry(0.06 * h, 0.09 * h, h * 0.6, 6).translate(x, h * 0.3, z), fbark); for (let i = 0; i < 3; i++) fb.add(new THREE.IcosahedronGeometry(h * (0.3 + r() * 0.1), 1).translate(x + (r() - 0.5) * h * 0.3, h * (0.72 + r() * 0.15), z + (r() - 0.5) * h * 0.3), fleaf); };
  for (let z = 110; z < 460; z += 13) for (const x of [-44, 44, -110, 110]) farTree(x + (z % 3), z, 11, z + x);
  for (let x = -130; x <= 130; x += 10) if (Math.abs(x) > 18) { farTree(x, -82, 10, x + 7); farTree(x + 4, -176, 11, x + 9); }
  for (let z = -60; z < 420; z += 14) for (const x of [-150, 150]) farTree(x, z, 12, z * 3 + x);

  // =============== THE SEINE, bridge, far Paris ===============
  const WY = -3.6, QN = -90, QF = -168;
  waterPlane(root, -900, 900, QF, QN, WY);
  const quayM = lam("twrQuay", () => ({ map: stoneHD("twrQuayHD", ["#d9cdb6", "#cfc2a8", "#e2d7c2", "#c6b89c"], "#9a8a72") }));
  b.add(boxGeo(V(-900, WY - 2, QN - 0.5), V(900, 0, QN), 3), quayM); b.add(boxGeo(V(-900, WY - 2, QF), V(900, 0, QF + 0.5), 3), quayM);
  b.add(boxGeo(V(-900, 0, QN + 0.1), V(-17, 0.9, QN + 0.7), 3), quayM); b.add(boxGeo(V(17, 0, QN + 0.1), V(900, 0.9, QN + 0.7), 3), quayM);
  b.add(quad(V(-900, 0, -86), V(900, 0, -86), V(900, 0, QN), V(-900, 0, QN), 450, 1), lam("twrQuayRoad", () => ({ map: cobbleHD() })));
  G(-900, 900, -900, QF, lam("twrFarBank", () => ({ map: gravelTex(), color: "#d8d0c4" })), 0, 8);
  // Pont d'Iena: stone deck with five arches
  { const sh = new THREE.Shape(); sh.moveTo(-QN - 1, WY - 1.5); sh.lineTo(-QF + 1, WY - 1.5); sh.lineTo(-QF + 1, 0.9); sh.lineTo(-QN - 1, 0.9); sh.closePath();
    const span = (-QF - -QN) / 5, pier = 2.2;
    for (let k = 0; k < 5; k++) { const u0 = -QN + k * span + pier / 2, u1 = u0 + span - pier, cu = (u0 + u1) / 2, hw = (u1 - u0) / 2; const h = new THREE.Path(); h.moveTo(u0, WY - 1.6); h.lineTo(u0, WY + 0.6); h.absellipse(cu, WY + 0.6, hw, 2.6, Math.PI, 0, true, 0); h.lineTo(u1, WY - 1.6); h.closePath(); sh.holes.push(h); }
    const bg = new THREE.ExtrudeGeometry(sh, { depth: 26, bevelEnabled: false, curveSegments: 16 }); bg.rotateY(Math.PI / 2); bg.translate(-13, 0, 0);
    const uv = bg.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 3, uv.getY(i) / 3);
    b.add(bg, lam("twrBridge", () => ({ map: stoneHD("twrBridgeHD", ["#e6dccb", "#dbcfba", "#efe6d6", "#d2c4ac"], "#a8977e") })));
    for (const x of [-13.2, 12.4]) b.add(boxGeo(V(x, 0.9, QF), V(x + 0.8, 1.9, QN)), quayM);
    for (let z = QN - 8; z > QF; z -= 15) for (const x of [-13.5, 13.5]) { b.add(new THREE.CylinderGeometry(0.12, 0.16, 4, 8).translate(x, 3.9, z), ironDark()); b.add(new THREE.SphereGeometry(0.28, 10, 8).translate(x, 6.0, z), lam("twrLampGlobe", () => ({ color: "#f6ecd4" }))); }
    solid([-13.2, -6, QF], [13.2, 2, QN]); }
  const barges = [barge(root, 0.9), barge(root, 0.6, "#5a3a2a")];
  barges[0].position.set(-60, WY + 0.1, -140); barges[1].position.set(120, WY + 0.1, -112); barges[1].rotation.y = Math.PI;
  // far city
  const cb = new Batch(), cr = rng(77);
  const row = (z: number, xs: number, xe: number, gapAt: number[], hMin: number, hMax: number) => {
    let x = xs; let k = 0;
    while (x < xe) { const w = 16 + cr() * 18, d = 16 + cr() * 8, h = hMin + cr() * (hMax - hMin), cx = x + w / 2;
      if (!gapAt.some((gx) => Math.abs(cx - gx) < w / 2 + 10)) hauss(cb, cx, z - d / 2, 0, w, d, h, k % 4, k + Math.round(z));
      x += w + (cr() < 0.2 ? 12 : 0.3); k++; }
  };
  row(-182, -560, 560, [0], 18, 21); row(-222, -600, 600, [0, -220], 19, 24); row(-262, -640, 640, [120], 20, 25); row(-305, -700, 700, [], 20, 26); row(-352, -760, 760, [], 21, 27); row(-410, -820, 820, [], 22, 28);
  for (const sx of [-1, 1]) { let z = -70, k = 0; while (z < 460) { const w = 16 + cr() * 16, d = 16 + cr() * 6, h = 18 + cr() * 5; hauss(cb, sx * (168 + d / 2), z + w / 2, sx > 0 ? -Math.PI / 2 : Math.PI / 2, w, d, h, (k + 1) % 4, 300 + k * 7); z += w + 0.3; k++; } }
  for (const sx of [-1, 1]) { let z = -60, k = 0; while (z < 460) { const w = 18 + cr() * 14, d = 18, h = 21 + cr() * 5; hauss(cb, sx * (205 + d / 2), z + w / 2, sx > 0 ? -Math.PI / 2 : Math.PI / 2, w, d, h, (k + 2) % 4, 500 + k * 5); z += w + 0.3; k++; } }
  domeChurch(cb, 150, -300, 1.15);
  cb.build(root);
  fb.build(root);

  // =============== 1889 FAIR DRESSING (c.fair) ===============
  const fairG = new THREE.Group(); root.add(fairG);
  const PEN = ["#2a4aa6", "#f6f2ea", "#d8352e", "#f4c430", "#2f9a6b", "#e86aa8"];
  const buntings: Bunting[] = [];
  const A = (sx: number, sz: number, y: number) => corner(sx, sz, y, "A"), Bc = (sx: number, sz: number, y: number) => corner(sx, sz, y, "B"), O = (sx: number, sz: number, y: number) => corner(sx, sz, y, "O");
  for (const [y, sag] of [[9, 2.2], [15, 3.2]]) {
    for (const sz of [-1, 1]) buntings.push(bunting(fairG, A(1, sz, y).toArray() as V3, A(-1, sz, y).toArray() as V3, sag, PEN, 0.6));
    for (const sx of [-1, 1]) buntings.push(bunting(fairG, Bc(sx, 1, y).toArray() as V3, Bc(sx, -1, y).toArray() as V3, sag, PEN, 0.6));
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) buntings.push(bunting(fairG, corner(sx, sz, 12, "N").toArray() as V3, [0, 16, 0], 1.6, PEN, 0.55));
  const poles: V3[] = [[-30, 0, 44.5], [-12, 0, 44.5], [12, 0, 44.5], [30, 0, 44.5], [44, 0, 20], [44, 0, -20], [-44, 0, 20], [-44, 0, -20]];
  const flags: Cloth[] = [];
  const flagM = lam("twrFlagM", () => ({ map: tricolourTex(), side: THREE.DoubleSide }));
  poles.forEach((p, i) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 10, 8).translate(p[0], 5, p[2]), lam("twrPoleWhite", () => ({ color: "#f2ece0" }))); pole.castShadow = true; fairG.add(pole);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8).translate(p[0], 10.1, p[2]), lam("twrGold", () => ({ color: "#eec258" }))); fairG.add(ball);
    const f = cloth(fairG, 2.6, 1.7, flagM, 0.22, i * 1.7); f.m.position.set(p[0] + 0.08, 9.8, p[2]); f.m.rotation.y = i < 4 ? 0.3 : Math.PI / 2; flags.push(f);
  });
  for (const sx of [-1, 1]) {
    buntings.push(bunting(fairG, O(sx, 1, 8).toArray() as V3, [sx * 30, 9.6, 44.5], 1.8, PEN, 0.55));
    buntings.push(bunting(fairG, A(sx, 1, 6).toArray() as V3, [sx * 12, 9.6, 44.5], 1.6, PEN, 0.55));
    buntings.push(bunting(fairG, [sx * 12, 9.6, 44.5], [sx * 30, 9.6, 44.5], 1.2, PEN, 0.55));
  }
  buntings.push(bunting(fairG, [-12, 9.6, 44.5], [12, 9.6, 44.5], 1.4, PEN, 0.55));
  // EXPOSITION 1889 banner in the front arch
  const bannerG = new THREE.Group(); bannerG.position.set(-7.5, 18.2, AP + 0.6); fairG.add(bannerG);
  const banner = cloth(bannerG, 15, 3.05, lam("twrBannerM", () => ({ map: bannerTex(), side: THREE.DoubleSide })), 0.08, 0.4, 16);
  for (const x of [-6.6, 6.6]) { const yTop = ARCH.ys + (ARCH.ya - ARCH.ys) * Math.sqrt(1 - (x / (I(ARCH.ys) + 0.3)) ** 2); rod(fairG, [x, 18.2, AP + 0.6], [x, yTop, AP + 0.3], 0.03, lam("twrRope", () => ({ color: "#d8c8a0" }))); }
  // tricolour swags under the front + side friezes
  const swM = lam("twrSwagM", () => ({ map: swagTex(), alphaTest: 0.5, side: THREE.DoubleSide }));
  const swb = new Batch();
  for (let s = 0; s < 4; s++) { const rot = new THREE.Matrix4().makeRotationY((s * Math.PI) / 2); swb.add(quad(V(-F1, YTOPF - 2.4, F1 + 0.06), V(F1, YTOPF - 2.4, F1 + 0.06), V(F1, YTOPF - 0.6, F1 + 0.06), V(-F1, YTOPF - 0.6, F1 + 0.06), (2 * F1) / 6, 1), swM, rot); }
  swb.build(fairG);
  const stalls = [stall(fairG, [-24, 0, 37.5], 0.2, 2.6, "#d8352e", "#f6f2ea", 11), stall(fairG, [-36, 0, 35.5], 0.35, 2.4, "#2a4aa6", "#f6f2ea", 14), stall(fairG, [36, 0, 36.5], -0.3, 2.4, "#f4c430", "#f6f2ea", 17)];

  // =============== PAYOFF GLOW (c.glow) ===============
  const burst = new THREE.Sprite(new THREE.SpriteMaterial({ map: burstTex(), color: new THREE.Color(1.5, 1.2, 0.85), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 }));
  burst.position.set(0, 92, -200); burst.scale.set(420, 420, 1); burst.layers.set(NOINK); burst.renderOrder = -0.4; root.add(burst);
  const hazes = [glow(root, [0, 34, -30], "#ffb860", 150, 0.5), glow(root, [0, 95, -40], "#ffc070", 190, 0.5), glow(root, [0, 8, 0], "#ffd090", 120, 0.4)];
  const spk: THREE.Sprite[] = [];
  { const r = rng(9); const group = new THREE.Group(); root.add(group);
    for (let i = 0; i < 70; i++) { const y = 3 + Math.pow(r(), 1.3) * 160, w = W(y) * (r() * 2 - 1), sd = r(); const p: V3 = sd < 0.5 ? [w, y, W(y) + 0.6] : [W(y) + 0.6, y, w];
      const s = sparkles(group, 1, p, 0.1, 0.1, 0.1, 30 + i, 1.4 + y * 0.03)[0]; spk.push(s); } }
  // pigeons round the tower and up top
  const birdsA = pigeons(root, 9, [0, 22, 0], 34, 14, 2.2, 3), birdsB = pigeons(root, 6, [0, 120, 0], 16, 30, 3.5, 4), birdsC = pigeons(root, 5, [8, 7, 30], 9, 3, 1.0, 5);

  b.build(root);

  // =============== MARKS + CAMS ===============
  const marks: Record<string, V3> = {
    // hero group in front of the near leg (near leg + front arch + first platform behind them in the group cam)
    lustig: [5.4, 0, 39.9], poisson: [6.3, 0, 39.2], mmePoisson: [7.2, 0, 39.9], dealer: [4.5, 0, 38.9],
    // the same group deeper, right under the near leg's overhang
    under1: [12.4, 0, 30.2], under2: [13.7, 0, 29.4], under3: [14.9, 0, 30.0], under4: [11.1, 0, 29.2],
    kiosk: [14.6, 0, 38.4],                                      // at the kiosk window (window faces +z, yaw 0.35)
    stairBottom: [18.9, 0, 33.4], stairMid: [19.1, +stepY(17).toFixed(2), +stepZ(17).toFixed(2)], // flight 1, step 18
    landing: [19.1, ST.L1, 23.1], landing2: [25.7, 12.0, 22.3], stairTop: [20.9, 15.6, 21.5],
    plank1: [25.3, PY, PZ], plank2: [27.7, PY, PZ],
    extra1: [9.5, 0, 31.5], extra2: [-3.5, 0, 26.0], extra3: [-10.5, 0, 17.0], extra4: [24.5, 0, 39.5], extra5: [-18.0, 0, 46.5], extra6: [1.5, 0, 52.0], extra7: [-7.0, 0, 6.0], extra8: [27.5, 0, 47.5],
    car: [-4.0, 0, 46.5],                                          // limousine centre, 5 x 2 m along x, on the gravel drive
    placard: [20.6, 0, 36.0],                                     // FOR SALE placard leaning on the front pier of the near leg
    cart: [3.5, 0, 22.0],
  };
  const cams: Record<string, { pos: V3; look: V3; fov?: number }> = {
    wide: { pos: [16, 1.6, 205], look: [0, 80, 0], fov: 45 },
    group: { pos: [3.5, 0.7, 50.5], look: [7.0, 8.0, 30.0], fov: 45 },
    groupUnder: { pos: [4.5, 1.35, 39.5], look: [13.0, 5.5, 24.0], fov: 40 },
    lowLeg: { pos: [17.0, 0.35, 35.0], look: [19.3, 7.6, 23.4], fov: 42 },
    landing: { pos: [19.0, 9.2, 22.8], look: [6.4, 0.6, 39.4], fov: 42 },
    plank: { pos: [28.8, 6.25, 32.7], look: [15.5, 0.6, 41.0], fov: 42 },
    painters: { pos: [20.6, 5.2, 37.0], look: [26.6, 5.4, 32.2], fov: 40 },
    kiosk: { pos: [11.4, 1.5, 44.0], look: [15.6, 1.8, 36.0], fov: 38 },
  };

  return {
    name: "tower", root, marks, cams,
    sun: { az: 130 }, // front / side light on the brown lattice in every preset (elevation stays per preset)
    pose: (t, c) => {
      const fair = c.fair ?? 0, rust = (c.rust ?? 1) * (1 - fair), gl = c.glow ?? 0;
      P.set(rust, fair, gl);
      fairG.visible = fair > 0.5;
      if (fairG.visible) { buntings.forEach((bt) => flutter(bt, t)); flags.forEach((f) => wave(f, t)); wave(banner, t, 2.5); stalls.forEach((s) => flutterStall(s, t)); }
      wave(topFlag, t, 5);
      trees.forEach((tr) => swayTree(tr, t));
      birdsA(t); birdsB(t); birdsC(t); balloons(t);
      plankG.rotation.x = Math.sin(t * 0.8) * 0.004; plankG.rotation.z = Math.sin(t * 0.55 + 1) * 0.002;
      bucketG.rotation.z = Math.sin(t * 1.3) * 0.12; bucketG.rotation.x = Math.sin(t * 1.1 + 2) * 0.05; dangle.rotation.z = Math.sin(t * 1.05 + 1) * 0.1;
      barges[0].position.x = -60 + t * 1.6; barges[1].position.x = 120 - t * 1.1;
      barges.forEach((bg, i) => { bg.position.y = WY + 0.1 + Math.sin(t * 0.9 + i) * 0.05; bg.rotation.z = Math.sin(t * 0.7 + i) * 0.008; });
      burst.visible = gl > 0.01; (burst.material as THREE.SpriteMaterial).opacity = 0.85 * gl; burst.material.rotation = t * 0.03;
      hazes.forEach((h, i) => { h.visible = gl > 0.01; (h.material as THREE.SpriteMaterial).opacity = gl * (0.35 + 0.08 * Math.sin(t * 0.8 + i)); });
      sparkle(spk, t, gl);
      lampGlows.forEach((s, i) => { (s.material as THREE.SpriteMaterial).opacity = 0.6 + 0.4 * gl + 0.05 * Math.sin(t * 7 + i); });
    },
  };
};
