// Debtors' prison cell, 1813 (S09). Night key: moon-blue window beam + warm candle pool, torch-lit corridor behind
// the barred door. Cell x -1.7..1.8, z -2.5..3.6; back wall at z -2.5 (window high left, door right), corridor behind.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad, Strand } from "../build";
import { stoneHD, beamHD, ctex, rng } from "../paint";
import { NOINK } from "../ink";
import { glow, shaft, sack, barrel, rod } from "../setkit";
import { over, strawTex, paperTex, candle, torch, flameFlick, motes, bars, boardsH, beamStain, metal, TAU } from "./innerkit_b";
import type { SetDef, V3 } from "./types";

const cellStone = () => over("cellStoneB", 1024, 1024, stoneHD("cellStoneRaw", ["#a7a3a0", "#9c9894", "#b0aaa2", "#928d8a", "#a39c92"], "#5e5853"), (g, r) => {
  g.globalCompositeOperation = "multiply"; g.fillStyle = "#a49c98"; g.fillRect(0, 0, 1024, 1024); g.globalCompositeOperation = "source-over";
  // damp streaks, moss at the foot, soot
  for (let i = 0; i < 16; i++) { const x = r() * 1024, w = 10 + r() * 30, h = 200 + r() * 500, y = r() * 300; const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, "rgba(60,58,70,0.22)"); gr.addColorStop(1, "rgba(60,58,70,0)"); g.fillStyle = gr; g.fillRect(x, y, w, h); }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${90 + r() * 30},${120 + r() * 20},70,0.22)`; g.beginPath(); g.ellipse(r() * 1024, 940 + r() * 84, 20 + r() * 40, 8 + r() * 14, 0, 0, TAU); g.fill(); }
});
const flagTex = () => over("cellFlagB", 1024, 1024, stoneHD("cellFlagRaw", ["#9a8f86", "#8f857c", "#a59a8f", "#877d76"], "#5c544e"), (g, r) => {
  for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(70,60,52,0.12)"; g.beginPath(); g.arc(r() * 1024, r() * 1024, 30 + r() * 90, 0, TAU); g.fill(); }
  for (let i = 0; i < 120; i++) { g.strokeStyle = "rgba(220,180,90,0.5)"; g.lineWidth = 2; const x = r() * 1024, y = r() * 1024, a = r() * TAU; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 18, y + Math.sin(a) * 18); g.stroke(); } // stray straw
});
/** scratched tally marks + big 1813 */
const tallyTex = () => ctex("tally1813", 1024, 768, (g, r) => {
  const scratch = (pts: [number, number][], w: number) => {
    g.lineCap = "round"; g.lineJoin = "round";
    g.strokeStyle = "rgba(30,24,30,0.55)"; g.lineWidth = w + 6; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x + 3, y + 4) : g.moveTo(x + 3, y + 4))); g.stroke();
    g.strokeStyle = "#f1ead8"; g.lineWidth = w; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
  };
  // tally rows
  for (let row = 0; row < 3; row++) for (let grp = 0; grp < 5 - (row === 2 ? 2 : 0); grp++) {
    const x0 = 70 + grp * 180 + r() * 10, y0 = 40 + row * 120;
    for (let k = 0; k < 4; k++) scratch([[x0 + k * 30, y0 + r() * 8], [x0 + k * 30 + (r() - 0.5) * 10, y0 + 90]], 9);
    scratch([[x0 - 14, y0 + 70], [x0 + 112, y0 + 18]], 8);
  }
  // 1813, scratched big
  g.font = "900 300px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.lineJoin = "round";
  g.strokeStyle = "rgba(30,24,30,0.6)"; g.lineWidth = 34; g.strokeText("1813", 518, 588);
  g.fillStyle = "#f4eddc"; g.fillText("1813", 512, 580);
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 400; i++) { g.globalAlpha = 0.6 * r(); g.fillRect(r() * 1024, 430 + r() * 300, 2 + r() * 8, 1 + r() * 3); }
  g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
});
const holeTex = () => ctex("mouseholeB", 128, 128, (g) => { g.fillStyle = "#1a1424"; g.beginPath(); g.moveTo(14, 128); g.lineTo(14, 70); g.arc(64, 70, 50, Math.PI, 0); g.lineTo(114, 128); g.fill(); });
const patchTex = () => ctex("moonPatchB", 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 20, 128, 128, 128); gr.addColorStop(0, "rgba(255,255,255,0.95)"); gr.addColorStop(0.7, "rgba(255,255,255,0.6)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000";
  for (let i = 0; i < 4; i++) g.fillRect(36 + i * 56, 0, 14, 256);
  g.fillRect(0, 118, 256, 14);
});

export const prison = (): SetDef => {
  const root = new THREE.Group(), shell = new Batch(), b = new Batch();
  const stone = lam("cellStone", () => ({ map: cellStone() }));
  const flag = lam("cellFlag", () => ({ map: flagTex() }));
  const beam = lam("cellBeam", () => ({ map: beamStain("cellBeam", "#6a5a6a", 0.45) }));
  const plank = lam("cellPlank", () => ({ map: boardsH("cellCeil", "#5a4a5a", 0.5) }));
  const iron = metal("cellIron", "#4b5468", 30);
  const rust = lam("cellRust", () => ({ color: "#6a4a3a" }));
  const X0 = -1.7, X1 = 1.8, ZB = -2.5, ZF = 3.8, H = 3.4, T = 0.3;
  // ---- floor, ceiling ----
  shell.add(quad(V(X0, 0, ZF), V(X1, 0, ZF), V(X1, 0, ZB), V(X0, 0, ZB), (X1 - X0) / 3, (ZF - ZB) / 3), flag);
  shell.add(quad(V(-0.6, 0, -2.5 - T), V(7, 0, -2.5 - T), V(7, 0, -5.2), V(-0.6, 0, -5.2), 7.6 / 3, 2.4 / 3), flag);
  // ---- back wall with window hole (x -1.25..-0.45, y 2.3..3.0) and door hole (x 0.35..1.35, y 0..2.2) ----
  const WX0 = -1.5, WX1 = -0.75, WY0 = 2.3, WY1 = 3.0, DX0 = 0.35, DX1 = 1.35, DY = 2.2;
  const bw = (x0: number, x1: number, y0: number, y1: number) => shell.add(boxGeo(V(x0, y0, ZB - T), V(x1, y1, ZB), 3), stone);
  bw(X0 - T, WX0, 0, H); bw(WX0, WX1, 0, WY0); bw(WX0, WX1, WY1, H); bw(WX1, DX0, 0, H); bw(DX0, DX1, DY, H); bw(DX1, X1 + T, 0, H);
  // side walls
  shell.add(boxGeo(V(X0 - T, 0, ZB - T), V(X0, H, ZF), 3), stone);
  shell.add(boxGeo(V(X1, 0, ZB - T), V(X1 + T, H, ZF), 3), stone);
  // ceiling: planks on heavy beams
  shell.add(quad(V(X0, H, ZB), V(X1, H, ZB), V(X1, H, ZF), V(X0, H, ZF), (X1 - X0) / 2, (ZF - ZB) / 2), plank);
  for (let z = ZB + 0.45; z < ZF; z += 1.0) b.add(boxGeo(V(X0, H - 0.26, z - 0.13), V(X1, H, z + 0.13), 3), beam);
  b.add(boxGeo(V(X0, H - 0.3, ZB), V(X1, H - 0.05, ZB + 0.22), 3), beam); // wall plate
  // door frame (stone lintel + jambs proud of the wall) and window sill
  const lintel = lam("cellLintel", () => ({ map: stoneHD("cellLintelRaw", ["#b9b2a6", "#aea79b"], "#7a7268") }));
  b.add(boxGeo(V(DX0 - 0.18, DY, ZB - 0.05), V(DX1 + 0.18, DY + 0.32, ZB + 0.08), 2), lintel);
  b.add(boxGeo(V(DX0 - 0.18, 0, ZB - 0.05), V(DX0, DY, ZB + 0.08), 2), lintel);
  b.add(boxGeo(V(DX1, 0, ZB - 0.05), V(DX1 + 0.18, DY, ZB + 0.08), 2), lintel);
  b.add(boxGeo(V(WX0 - 0.08, WY0 - 0.1, ZB - T), V(WX1 + 0.08, WY0, ZB + 0.1), 2), lintel);
  bars(b, WX0, WX1, WY0, WY1, ZB - 0.15, 4, 0.022, iron, [2.65]);
  // ---- corridor behind the door (torch-lit) ----
  const cz0 = ZB - T, cz1 = -5.2, CH = 2.9;
  shell.add(boxGeo(V(-0.9, 0, cz1 - T), V(7, CH, cz1), 3), stone);
  shell.add(boxGeo(V(-0.9, 0, cz1), V(-0.6, CH, cz0), 3), stone);
  shell.add(quad(V(-0.6, CH, cz0), V(7, CH, cz0), V(7, CH, cz1), V(-0.6, CH, cz1), 4, 1.2), plank);
  for (let x = 0; x < 7; x += 1.2) b.add(boxGeo(V(x - 0.1, CH - 0.2, cz1), V(x + 0.1, CH, cz0), 3), beam);
  // another cell door across the corridor + keys on a hook + guard's stool and barrel
  const odoor = lam("cellOakDoor", () => ({ map: boardsH("cellOak", "#5a3a2a", 0.55) }));
  b.add(boxGeo(V(2.4, 0, cz1 + 0.0), V(3.4, 2.1, cz1 + 0.08), 1), odoor);
  b.add(boxGeo(V(2.75, 1.55, cz1 + 0.07), V(3.05, 1.8, cz1 + 0.1)), iron);
  for (const y of [0.35, 1.75]) b.add(boxGeo(V(2.4, y - 0.05, cz1 + 0.08), V(3.4, y + 0.05, cz1 + 0.12)), iron);
  const keys = new THREE.Group(); keys.position.set(1.85, 1.45, cz1 + 0.06); root.add(keys);
  const brassK = lam("brassB", () => ({ color: "#d9a640" }));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 6, 16), iron); keys.add(ring);
  for (let i = 0; i < 3; i++) { const k = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.16, 0.012), brassK); k.position.set(-0.04 + i * 0.04, -0.12, 0.01); k.rotation.z = (i - 1) * 0.3; keys.add(k); }
  barrel(root, [0.0, 0, -4.6], 0.32, 1);
  b.add(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 14).translate(1.6, 0.45, -4.5), beam);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; rod(root, [1.6 + Math.cos(a) * 0.14, 0.44, -4.5 + Math.sin(a) * 0.14], [1.6 + Math.cos(a) * 0.2, 0, -4.5 + Math.sin(a) * 0.2], 0.02, beam); }
  const torches = [torch(root, [0.75, 1.75, cz1 + 0.35], 0, 7, 6), torch(root, [4.2, 1.75, cz1 + 0.35], 0, 6, 6)];
  // ---- the barred cell door (hinged at x = DX0) ----
  const door = new THREE.Group(); door.position.set(DX0 + 0.02, 0, ZB - 0.12); root.add(door);
  const db = new Batch();
  bars(db, 0.02, DX1 - DX0 - 0.06, 0.05, DY - 0.05, 0, 6, 0.024, iron, [0.12, 1.1, DY - 0.12]);
  db.add(boxGeo(V(0, 0.05, -0.04), V(0.06, DY - 0.05, 0.04)), iron);
  db.add(boxGeo(V(DX1 - DX0 - 0.12, 0.05, -0.04), V(DX1 - DX0 - 0.04, DY - 0.05, 0.04)), iron);
  db.add(boxGeo(V(DX1 - DX0 - 0.3, 0.95, -0.06), V(DX1 - DX0 - 0.05, 1.25, 0.06)), rust); // lock box
  db.build(door);
  const keyhole = new THREE.Mesh(new THREE.CircleGeometry(0.025, 10), new THREE.MeshBasicMaterial({ color: "#1a1420" })); keyhole.position.set(DX1 - DX0 - 0.175, 1.1, 0.062); door.add(keyhole);
  for (const y of [0.3, 1.9]) { const hg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.16, 10), iron); hg.position.set(-0.02, y, 0); door.add(hg); }
  // ---- straw bed (left, under the moonbeam), blanket ----
  const strawM = lam("cellStraw", () => ({ map: strawTex() }));
  const mound = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, TAU, 0, Math.PI / 2), strawM);
  mound.scale.set(1.0, 0.36, 0.85); mound.position.set(-0.85, 0, -1.25); mound.receiveShadow = mound.castShadow = true; root.add(mound);
  const r = rng(77);
  { const mp = mound.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < mp.count; i++) { const k = 1 + 0.12 * Math.sin(mp.getX(i) * 9 + mp.getZ(i) * 5) * Math.cos(mp.getZ(i) * 7); mp.setXYZ(i, mp.getX(i) * k, mp.getY(i) * (0.85 + 0.3 * Math.abs(Math.sin(mp.getX(i) * 11))), mp.getZ(i) * k); } mound.geometry.computeVertexNormals(); }
  // loose straw scattered round the bed: alpha-cut decal (no ink on single straws)
  const looseTex = ctex("looseStrawB", 512, 512, (g, rr) => { for (let i = 0; i < 420; i++) { const a = rr() * TAU, d = 120 + rr() * 130, x = 256 + Math.cos(a) * d, y = 256 + Math.sin(a) * d, aa = rr() * TAU, l = 14 + rr() * 30; g.strokeStyle = rr() < 0.5 ? "#e8c56a" : "#b88a3a"; g.lineWidth = 3 + rr() * 2; g.lineCap = "round"; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(aa) * l, y + Math.sin(aa) * l); g.stroke(); } });
  const loose = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 2.5).rotateX(-Math.PI / 2), lam("cellLoose", () => ({ map: looseTex, transparent: true, alphaTest: 0.4 })));
  loose.position.set(-0.85, 0.006, -1.2); loose.receiveShadow = true; loose.layers.set(NOINK); root.add(loose);
  const blanket = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7, 8, 6), lam("cellBlanket", () => ({ map: ctex("blanketB", 256, 256, (g, rr) => { g.fillStyle = "#6d6a8a"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#4a4766"; g.lineWidth = 10; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, i * 48 + 20); g.lineTo(256, i * 48 + 20); g.stroke(); } for (let i = 0; i < 6; i++) { g.fillStyle = "#8a6e5a"; g.fillRect(rr() * 220, rr() * 220, 30, 26); } }), side: THREE.DoubleSide })));
  const bp = blanket.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < bp.count; i++) bp.setZ(i, 0.06 * Math.sin(bp.getX(i) * 7) * Math.cos(bp.getY(i) * 5)); blanket.geometry.computeVertexNormals();
  blanket.rotation.x = -Math.PI / 2 + 0.12; blanket.rotation.z = 0.5; blanket.position.set(-1.1, 0.2, -1.55); blanket.castShadow = true; root.add(blanket);
  // ---- the moonlit window: moon + stars outside, beam, floor patch, dust in the beam ----
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex("moonB", 128, 128, (g) => { g.fillStyle = "#f6f2dc"; g.beginPath(); g.arc(64, 64, 60, 0, TAU); g.fill(); g.fillStyle = "rgba(190,190,200,0.5)"; for (const [x, y, rr] of [[44, 50, 12], [80, 76, 9], [70, 40, 6]]) { g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); } }), color: new THREE.Color(1.6, 1.6, 1.5), fog: false, transparent: true }));
  moon.scale.set(1.6, 1.6, 1); moon.position.set(-3.9, 4.7, -14); moon.layers.set(NOINK); root.add(moon);
  glow(root, [-3.9, 4.7, -14.1], "#8fa8ff", 7, 0.7);
  const starG = new THREE.BufferGeometry(), sp: number[] = [];
  for (let i = 0; i < 90; i++) sp.push(-9 + r() * 12, 2.5 + r() * 9, -16 - r() * 3);
  starG.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(starG, new THREE.PointsMaterial({ size: 0.09, color: "#e8eeff", transparent: true, fog: false, depthWrite: false })); stars.layers.set(NOINK); root.add(stars);
  const beamS = shaft(root, [-1.12, 2.7, ZB - 0.1], [-0.8, 0.0, -0.75], 0.8, "#9fb6ff", 0.4);
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.25).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: patchTex(), color: new THREE.Color("#7f95e0").multiplyScalar(0.55), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  patch.position.set(-0.78, 0.27, -1.0); patch.rotation.y = 0.1; patch.layers.set(NOINK); root.add(patch);
  const moonL = new THREE.SpotLight("#9ab0ff", 14, 7, 0.42, 0.6, 1.2); moonL.position.set(-1.2, 2.65, -2.3); moonL.target.position.set(-0.8, 0, -1.0); root.add(moonL, moonL.target);
  const dust = motes(root, [-1.35, 0.3, -2.2], [-0.55, 2.5, -0.9], 45, "#c8d6ff", 0.03, 0.75, 3);
  // ---- wall: tally marks + 1813, chains, mousehole, an IOU nailed up ----
  const tally = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.82), new THREE.MeshBasicMaterial({ map: tallyTex(), transparent: true, color: new THREE.Color("#b9bccc").multiplyScalar(0.62), depthWrite: false }));
  tally.position.set(-0.22, 1.72, ZB + 0.012); tally.layers.set(NOINK); root.add(tally);
  const chain = lam("chainHD", () => ({}));
  for (const [x, y, dy] of [[-1.55, 1.95, 0.95], [-1.3, 2.05, 1.2]] as [number, number, number][]) {
    const ringM = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 6, 14), iron); ringM.position.set(x, y, ZB + 0.04); root.add(ringM);
    const st = new Strand(2, 0.05, 0.075, chain); const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push(V(x + 0.12 * u + 0.05 * Math.sin(u * Math.PI), y - 0.06 - dy * u, ZB + 0.05 + 0.08 * Math.sin(u * Math.PI))); }
    st.set(pts); root.add(st.mesh);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 6, 14), iron); cuff.position.set(x + 0.12, y - dy - 0.12, ZB + 0.06); cuff.rotation.y = 0.6; root.add(cuff);
  }
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), new THREE.MeshBasicMaterial({ map: holeTex(), transparent: true })); hole.position.set(-1.5, 0.08, ZB + 0.01); root.add(hole);
  const iouM = (k: string, lines: string[]) => new THREE.MeshBasicMaterial({ map: paperTex(k, lines), color: new THREE.Color("#c9c4d6").multiplyScalar(0.8), side: THREE.DoubleSide });
  const nailed = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.38), iouM("iou1", ["IOU", "$ 500", "owed to", "J. Pickett"])); nailed.position.set(1.58, 1.55, ZB + 0.02); nailed.rotation.z = 0.08; root.add(nailed);
  const ious: [number, number, number, string[]][] = [[0.15, -0.5, 0.4, ["IOU", "$ 1,200"]], [-0.05, 0.6, -0.5, ["IOU", "$ 300", "PAST DUE"]], [0.55, -1.6, 2.2, ["IOU", "$ 750"]], [-1.25, 0.15, 1.2, ["DEBT", "NOTICE"]]];
  ious.forEach(([x, z, a, l], i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.33).rotateX(-Math.PI / 2), iouM("iouF" + i, l)); m.rotation.y = a; m.position.set(x, 0.008 + i * 0.001, z); m.receiveShadow = true; root.add(m); });
  // ---- stool + candle, bucket, tin plate + cup + bread, water jug ----
  const stoolM = lam("cellStool", () => ({ map: beamStain("cellStool", "#8a6a50", 0.3) }));
  const SX = 0.95, SZ = -0.15;
  b.add(new THREE.CylinderGeometry(0.21, 0.2, 0.06, 16).translate(SX, 0.5, SZ), stoolM);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.4; rod(root, [SX + Math.cos(a) * 0.12, 0.48, SZ + Math.sin(a) * 0.12], [SX + Math.cos(a) * 0.2, 0, SZ + Math.sin(a) * 0.2], 0.022, stoolM); }
  const cand = candle(root, [SX - 0.04, 0.53, SZ + 0.02], 1.25, 9, 7);
  const bucketM = lam("cellBucket", () => ({ map: beamStain("cellBucket", "#7a5a40", 0.3) }));
  const bk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.34, 16, 1, true), bucketM); bk.position.set(1.35, 0.17, -1.85); bk.castShadow = true; root.add(bk);
  b.add(new THREE.CircleGeometry(0.16, 16).rotateX(-Math.PI / 2).translate(1.35, 0.03, -1.85), bucketM);
  for (const y of [0.06, 0.28]) { const hp = new THREE.Mesh(new THREE.TorusGeometry(0.17 + y * 0.1, 0.012, 5, 20), iron); hp.rotation.x = Math.PI / 2; hp.position.set(1.35, y, -1.85); root.add(hp); }
  const hdl = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.008, 4, 16, Math.PI), iron); hdl.position.set(1.35, 0.34, -1.85); hdl.rotation.y = 0.4; root.add(hdl);
  const tin = metal("cellTin", "#9aa3b4", 70);
  b.add(new THREE.CylinderGeometry(0.15, 0.12, 0.03, 18).translate(0.1, 0.015, -1.75), tin);
  b.add(new THREE.CylinderGeometry(0.05, 0.045, 0.11, 12).translate(0.32, 0.055, -1.9), tin);
  const cupH = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 5, 10), tin); cupH.position.set(0.38, 0.06, -1.9); root.add(cupH);
  const bread = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), lam("cellBread", () => ({ color: "#c98a46" }))); bread.scale.set(1.3, 0.6, 0.9); bread.position.set(0.08, 0.05, -1.75); bread.castShadow = true; root.add(bread);
  const jug = new THREE.Mesh(new THREE.LatheGeometry([0.0, 0.09, 0.12, 0.1, 0.06, 0.07].map((x, i) => new THREE.Vector2(x, i * 0.06)), 14), lam("cellJug", () => ({ color: "#b0704a" }))); jug.position.set(-0.25, 0, -2.2); jug.castShadow = true; root.add(jug);
  sack(root, [1.45, 0, -0.9], 0.2, "#9a8a6a");
  // ---- the rat (ambient: runs from the mousehole to the bread, sniffs, runs back) ----
  const rat = new THREE.Group(); root.add(rat);
  const ratM = lam("cellRat", () => ({ color: "#8a8296" })), pink = lam("cellRatPink", () => ({ color: "#e8a0a8" }));
  const rb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), ratM); rb.scale.set(1.6, 0.85, 0.9); rb.position.y = 0.06; rat.add(rb);
  const rh = new THREE.Group(); rh.position.set(0.11, 0.07, 0); rat.add(rh);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 10).rotateZ(-Math.PI / 2), ratM); head.position.x = 0.03; rh.add(head);
  for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.CircleGeometry(0.025, 10), pink); ear.position.set(0.0, 0.04, s * 0.03); ear.rotation.y = s * 0.6 + Math.PI / 2; rh.add(ear); }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), pink); nose.position.x = 0.085; rh.add(nose);
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.006, 4, 14, Math.PI * 0.8), pink); tail.position.set(-0.16, 0.05, 0); tail.rotation.set(Math.PI / 2, 0, 0.6); rat.add(tail);
  for (const s of [-1, 1]) for (const fx of [-0.05, 0.05]) { const leg = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), pink); leg.position.set(fx, 0.012, s * 0.045); leg.name = "leg"; rat.add(leg); }
  shell.build(root, false); b.build(root);
  const marks: Record<string, V3> = { straw: [-0.85, 0.3, -1.05], guard: [1.05, 0, -3.95], door: [0.85, 0, -1.6], stool: [SX, 0, SZ] };
  const cams = {
    cell: { pos: [0.35, 1.55, 3.5] as V3, look: [-0.05, 1.3, -2.4] as V3, fov: 54 },
    door: { pos: [0.55, 1.6, 0.8] as V3, look: [0.85, 1.3, -3.6] as V3, fov: 50 },
  };
  return {
    name: "prison", root, marks, cams,
    pose: (t, c) => {
      flameFlick(cand, t); torches.forEach((l) => flameFlick(l, t)); dust.update(t);
      moonL.intensity = 14 * (0.95 + 0.05 * Math.sin(t * 0.7));
      (beamS.material as THREE.MeshBasicMaterial).opacity = 0.27 + 0.03 * Math.sin(t * 0.9);
      door.rotation.y = (c.door ?? 0) * 1.75;
      keys.rotation.z = 0.08 * Math.sin(t * 1.3);
      // rat loop: 9 s = run out 2.2 s, sniff 2.4 s, run back 2.2 s, hidden 2.2 s
      const k = t % 9, xa = -1.45, xb = -0.12, z = ZB + 0.22;
      let x = xa, vis = true, dir = 1, run = false;
      if (k < 2.2) { const u = k / 2.2; x = xa + (xb - xa) * (u * u * (3 - 2 * u)); run = true; }
      else if (k < 4.6) { x = xb; }
      else if (k < 6.8) { const u = (k - 4.6) / 2.2; x = xb + (xa - xb) * (u * u * (3 - 2 * u)); dir = -1; run = true; }
      else vis = false;
      rat.visible = vis; rat.position.set(x, run ? Math.abs(Math.sin(t * 22)) * 0.012 : 0, z); rat.rotation.y = dir > 0 ? 0 : Math.PI;
      rh.rotation.z = run ? 0 : 0.15 + 0.12 * Math.sin(t * 14); rh.rotation.y = run ? 0 : 0.3 * Math.sin(t * 3);
      tail.rotation.z = 0.6 + 0.25 * Math.sin(t * (run ? 18 : 4));
      rat.children.forEach((ch, i) => { if (ch.name === "leg") ch.position.y = 0.012 + (run ? 0.012 * Math.sin(t * 30 + i * 1.7) : 0); });
    },
  };
};
