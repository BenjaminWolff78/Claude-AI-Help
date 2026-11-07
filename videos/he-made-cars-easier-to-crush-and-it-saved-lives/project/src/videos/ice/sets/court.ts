// THE COURTROOM, Amsterdam 1945-47 (home base A of "He Saved His Life by Proving His Masterpiece Was Fake"; light
// `court`, `courtPayoff` for the cheering ending). Room x -6..6, z -5 (back wall: the judge's bench) .. 6 (doors), ceiling 6.
//   * three tall arched windows on the LEFT wall (x = -6) with low sun shafts across the floor (the visible light source)
//   * the judge's raised bench (dais x -2.6..2.6, z -4.7..-3.1, top of the desk 1.55) with two green lamps, a gavel
//     block, files + inkwell; a high-backed red chair; behind it a carved panel with a scales emblem and RECHTBANK
//   * the DOCK (x -0.9..0.9, z -0.2..0.9, rail 1.05) in the middle facing the bench; two guards stand beside it
//   * the EVIDENCE EASEL (x -2.4, z -1.3) with THE PAINTING (framed), turned toward the room
//   * press benches on the right (x 2.4..5.6, z -2..3.6) for the reporters; public benches at the back (z 2.2..5)
//   * a wall clock over the bench, two brass ceiling fans (turn), two pendant globe lamps (sway a little)
// Controls (c): paint/crack/ink/age/wet = painting state | fans speed (default 1) | payoff 0..1 (brighter + streamers)
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../build";
import { ctex, rep, planksHD } from "../paint";
import { glow, shaft, rod } from "../setkit";
import { boardsV, beamStain, metal, motes, TAU } from "./innerkit_b";
import { fitText } from "./portkit_common";
import { framedPainting, otherTex } from "./masterpiece";
import { NOINK } from "../ink";
import type { SetDef, SetBuilder, V3 } from "./types";

const parquet = () => ctex("ctParquet", 1024, 1024, (g, r) => {
  g.fillStyle = "#8a5a32"; g.fillRect(0, 0, 1024, 1024);
  for (let y = -64; y < 1088; y += 64) for (let x = -128; x < 1152; x += 128) {
    const off = (y / 64) % 2 ? 64 : 0;
    for (const [dx, dy, w, h] of [[0, 0, 128, 32], [0, 32, 128, 32]] as const) {
      g.fillStyle = ["#a26a3a", "#94603a", "#b07444", "#8a5630", "#9c6638"][Math.floor(r() * 5)];
      g.save(); g.translate(x + off + dx + 64, y + dy + 16); g.rotate((dy ? 1 : -1) * 0.785); g.fillRect(-w / 2, -h / 2, w - 3, h - 3); g.restore();
    }
  }
  g.fillStyle = "rgba(255,230,190,0.07)"; for (let i = 0; i < 40; i++) g.fillRect(r() * 1024, r() * 1024, 120, 6);
});
const plasterG = () => ctex("ctPlaster", 512, 512, (g, r) => {
  g.fillStyle = "#9cb59a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 30; i++) { const x = r() * 512, y = r() * 512, rr = 40 + r() * 100; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, r() < 0.5 ? "rgba(255,255,230,0.18)" : "rgba(60,90,70,0.14)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
});
const skyWin = () => ctex("ctSkyWin", 256, 512, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#7fb4ec"); gr.addColorStop(0.7, "#dcecff"); gr.addColorStop(1, "#fff4dc"); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 5; i++) { g.fillStyle = "rgba(255,255,255,0.8)"; g.beginPath(); g.ellipse(r() * 256, 60 + r() * 180, 50, 16, 0, 0, TAU); g.fill(); }
  g.fillStyle = "#a07a5a"; for (let x = 0; x < 256; x += 42) { const h = 80 + r() * 60; g.fillRect(x, 512 - h, 38, h); g.beginPath(); g.moveTo(x, 512 - h); g.lineTo(x + 19, 512 - h - 30); g.lineTo(x + 38, 512 - h); g.fill(); }
});
const crestTex = () => ctex("ctCrest", 512, 512, (g) => {
  g.fillStyle = "#e8c45a"; g.strokeStyle = "#5a3a14"; g.lineWidth = 10;
  g.beginPath(); g.arc(256, 256, 236, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = "#6a1f2a"; g.beginPath(); g.arc(256, 256, 196, 0, TAU); g.fill();
  g.strokeStyle = "#f2d67a"; g.lineWidth = 12; g.lineCap = "round";
  g.beginPath(); g.moveTo(256, 120); g.lineTo(256, 380); g.moveTo(150, 170); g.lineTo(362, 170); g.moveTo(190, 400); g.lineTo(322, 400); g.stroke();
  for (const x of [150, 362]) { g.beginPath(); g.moveTo(x, 170); g.lineTo(x - 40, 270); g.moveTo(x, 170); g.lineTo(x + 40, 270); g.stroke(); g.beginPath(); g.arc(x, 270, 44, 0, Math.PI); g.stroke(); }
});
const plaqueTex = () => ctex("ctPlaque", 1024, 160, (g) => { g.fillStyle = "#3a2214"; g.fillRect(0, 0, 1024, 160); g.strokeStyle = "#e8c45a"; g.lineWidth = 8; g.strokeRect(10, 10, 1004, 140); g.fillStyle = "#f2d67a"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "RECHTBANK", 512, 84, 860, 110); });

export const court: SetBuilder = () => {
  const root = new THREE.Group(), b = new Batch();
  const X0 = -6, X1 = 6, Z0 = -5, Z1 = 9, HT = 6;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0).rotateX(-Math.PI / 2), lam("ctFloor", () => ({ map: rep(parquet(), 3, 3) }))); floor.position.set(0, 0, (Z0 + Z1) / 2); floor.receiveShadow = true; root.add(floor);
  const wain = lam("ctWain", () => ({ map: boardsV("ctWain", "#4a2414", 0.55) })), plaster = lam("ctPl", () => ({ map: rep(plasterG(), 3, 1.5) }));
  const oak = lam("ctOak", () => ({ map: beamStain("ctOak", "#5a2e18", 0.5) })), oakL = lam("ctOakL", () => ({ map: beamStain("ctOakL", "#8a4e28", 0.4) }));
  const cream = lam("ctCream", () => ({ color: "#efe4c8" })), gold = metal("ctGold", "#e0ac44", 70), brass = metal("ctBrass", "#c99a3a", 60), redL = lam("ctRed", () => ({ color: "#8e2430" }));
  // walls: wainscot to 1.4 m, sage plaster above, cream cornice
  const wall = (x0: number, z0: number, x1: number, z1: number) => { b.add(boxGeo(V(x0, 0, z0), V(x1, 1.4, z1), 1), wain); b.add(boxGeo(V(x0, 1.4, z0), V(x1, HT, z1), 1), plaster); b.add(boxGeo(V(x0, 1.38, z0), V(x1, 1.48, z1)), oakL); b.add(boxGeo(V(x0, HT - 0.3, z0), V(x1, HT, z1)), cream); };
  wall(X0, Z0 - 0.2, X1, Z0); wall(X1, Z0, X1 + 0.2, Z1); wall(X0, Z1, X1, Z1 + 0.2);
  // left wall with three tall arched windows
  const WZ = [-2.8, 0.4, 3.6], WW = 1.5, WB = 1.2, WT = 4.6;
  b.add(boxGeo(V(X0 - 0.2, 0, Z0), V(X0, 1.4, Z1), 1), wain);
  let z = Z0;
  for (const wz of WZ) { b.add(boxGeo(V(X0 - 0.2, 1.4, z), V(X0, HT, wz - WW / 2), 1), plaster); z = wz + WW / 2; }
  b.add(boxGeo(V(X0 - 0.2, 1.4, z), V(X0, HT, Z1), 1), plaster);
  const skyM = new THREE.MeshBasicMaterial({ map: skyWin(), color: new THREE.Color(1.25, 1.2, 1.1) });
  for (const wz of WZ) {
    b.add(boxGeo(V(X0 - 0.2, 1.4, wz - WW / 2), V(X0, WB, wz + WW / 2)), plaster);
    b.add(boxGeo(V(X0 - 0.2, WT + 0.6, wz - WW / 2), V(X0, HT, wz + WW / 2)), plaster);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(WW, WT - WB + 0.6), skyM); pane.position.set(X0 - 0.15, (WB + WT + 0.6) / 2, wz); pane.rotation.y = Math.PI / 2; root.add(pane);
    for (let k = 1; k < 3; k++) b.add(boxGeo(V(X0 - 0.14, WB, wz - WW / 2 + k * WW / 3 - 0.02), V(X0 - 0.08, WT + 0.6, wz - WW / 2 + k * WW / 3 + 0.02)), cream);
    for (let k = 1; k < 5; k++) b.add(boxGeo(V(X0 - 0.14, WB + k * 0.8, wz - WW / 2), V(X0 - 0.08, WB + k * 0.8 + 0.04, wz + WW / 2)), cream);
    b.add(boxGeo(V(X0 - 0.22, WB - 0.08, wz - WW / 2 - 0.12), V(X0 + 0.12, WB, wz + WW / 2 + 0.12)), oakL);
    for (const s of [-1, 1]) { const cu = new THREE.Mesh(new THREE.BoxGeometry(0.06, WT - WB + 1.0, 0.5), redL); cu.position.set(X0 + 0.06, (WB + WT + 0.6) / 2 + 0.2, wz + s * (WW / 2 + 0.25)); cu.castShadow = true; root.add(cu); }
    const patch = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#ffd99a", transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false })); patch.position.set(X0 + 4.2, 0.012, wz + 1.5); patch.layers.set(NOINK); root.add(patch);
  }
  b.add(boxGeo(V(X0, HT, Z0), V(X1, HT + 0.2, Z1)), lam("ctCeil", () => ({ color: "#efe6d2" })));
  for (let x = -4; x <= 4; x += 4) b.add(boxGeo(V(x - 0.18, HT - 0.45, Z0), V(x + 0.18, HT, Z1)), cream); // ceiling beams
  // pilasters on the back + right walls
  for (const x of [-4.2, 4.2]) b.add(boxGeo(V(x - 0.25, 0, Z0), V(x + 0.25, HT - 0.3, Z0 + 0.18)), cream);
  for (const zz of [-2.4, 1.6, 4.4]) b.add(boxGeo(V(X1 - 0.18, 0, zz - 0.25), V(X1, HT - 0.3, zz + 0.25)), cream);

  // ================= the judge's bench =================
  b.add(boxGeo(V(-2.8, 0, -4.9), V(2.8, 0.45, -3.0), 1), oak);                                    // dais
  b.add(boxGeo(V(-2.8, 0.45, -3.4), V(2.8, 1.5, -3.15), 1), oakL);                                 // bench front
  for (let k = 0; k < 5; k++) b.add(boxGeo(V(-2.5 + k * 1.05, 0.62, -3.16), V(-1.75 + k * 1.05, 1.32, -3.12)), oak); // panels
  b.add(boxGeo(V(-2.95, 1.5, -3.6), V(2.95, 1.58, -3.05), 1), oak);                                 // desk top
  { const chair = new THREE.Group(); chair.position.set(0, 0.45, -4.35); root.add(chair);
    chair.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.2, 0.12).translate(0, 1.4, -0.2), redL), new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.14).translate(0, 2.55, -0.2), oak));
    chair.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8).translate(-0.42, 2.66, -0.2), gold), new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8).translate(0.42, 2.66, -0.2), gold)); }
  // back panel with the crest + plaque, and a clock above
  b.add(boxGeo(V(-3.2, 0, Z0), V(3.2, 5.4, Z0 + 0.12)), oak);
  for (let k = 0; k < 6; k++) b.add(boxGeo(V(-3.0 + k * 1.02, 0.6, Z0 + 0.12), V(-2.15 + k * 1.02, 2.4, Z0 + 0.16)), oakL);
  const crest = new THREE.Mesh(new THREE.CircleGeometry(0.85, 40), lam("ctCrestM", () => ({ map: crestTex() }))); crest.position.set(0, 3.95, Z0 + 0.14); root.add(crest);
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.38), new THREE.MeshBasicMaterial({ map: plaqueTex() })); plaque.position.set(0, 5.05, Z0 + 0.15); root.add(plaque);
  { const face = new THREE.Mesh(new THREE.CircleGeometry(0.32, 32), new THREE.MeshBasicMaterial({ map: ctex("ctClock", 256, 256, (g) => { g.fillStyle = "#f6efdc"; g.beginPath(); g.arc(128, 128, 126, 0, TAU); g.fill(); g.fillStyle = "#2a2014"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "700 28px Georgia"; for (let i = 1; i <= 12; i++) { const a = (i / 12) * TAU - Math.PI / 2; g.fillText(String(i), 128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100); } g.strokeStyle = "#1c1612"; g.lineWidth = 7; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 60); g.moveTo(128, 128); g.lineTo(170, 150); g.stroke(); }) }));
    face.position.set(3.9, 4.6, Z0 + 0.08); root.add(face); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.04, 8, 32), gold); rim.position.copy(face.position); root.add(rim); }
  // desk things: two green lamps, gavel block + gavel, files, inkwell
  const lampsOn: THREE.PointLight[] = [];
  for (const x of [-1.9, 1.9]) {
    b.add(new THREE.CylinderGeometry(0.09, 0.11, 0.03, 18).translate(x, 1.595, -3.35), brass); b.add(new THREE.CylinderGeometry(0.014, 0.014, 0.34, 8).translate(x, 1.76, -3.35), brass);
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.34, 16, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI), metal("ctShade", "#1f8a52", 80)); sh.position.set(x, 1.95, -3.32); root.add(sh);
    const bl = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.1).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffe2a0").multiplyScalar(2.2), side: THREE.DoubleSide })); bl.position.set(x, 1.945, -3.32); bl.layers.set(NOINK); root.add(bl);
    const pl = new THREE.PointLight("#ffbe6a", 4, 4, 1.4); pl.position.set(x, 1.85, -3.1); root.add(pl); lampsOn.push(pl); glow(root, [x, 1.9, -3.25], "#ffc46a", 0.9, 0.7);
  }
  b.add(new THREE.CylinderGeometry(0.1, 0.11, 0.05, 16).translate(0.55, 1.605, -3.3), oak);
  const gavel = new THREE.Group(); gavel.position.set(0.85, 1.63, -3.3); root.add(gavel);
  gavel.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 12).rotateZ(Math.PI / 2), oakL)); gavel.add(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.3, 8).rotateX(Math.PI / 2).translate(0, 0, 0.15), oakL));
  for (let k = 0; k < 3; k++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.26), lam("ctFile" + k, () => ({ color: ["#e8dcc0", "#c9a86a", "#b8cbd8"][k] }))); f.position.set(-0.7 + k * 0.05, 1.6 + k * 0.03, -3.32); f.rotation.y = 0.1 * k; root.add(f); }
  b.add(new THREE.CylinderGeometry(0.04, 0.045, 0.06, 12).translate(-1.2, 1.61, -3.3), lam("ctInk", () => ({ color: "#1f2a4a" })));

  // ================= the dock (defendant's enclosure) =================
  const DX0 = -0.9, DX1 = 0.9, DZ0 = -0.2, DZ1 = 0.9, DR = 1.05;
  b.add(boxGeo(V(DX0, 0, DZ0), V(DX1, 0.1, DZ1)), oak);
  for (const [x0, z0, x1, z1] of [[DX0, DZ0, DX1, DZ0 + 0.06], [DX0, DZ0, DX0 + 0.06, DZ1], [DX1 - 0.06, DZ0, DX1, DZ1]] as const) {
    b.add(boxGeo(V(x0 - 0.03, DR - 0.08, z0 - 0.03), V(x1 + 0.03, DR, z1 + 0.03)), oakL);
    b.add(boxGeo(V(x0, 0.1, z0), V(x1, 0.3, z1)), oak);
    const L = Math.max(x1 - x0, z1 - z0), n = Math.round(L / 0.16);
    for (let k = 0; k <= n; k++) { const t = k / n, x = x0 + (x1 - x0 > 0.1 ? t * (x1 - x0) : 0.03), zz = z0 + (z1 - z0 > 0.1 ? t * (z1 - z0) : 0.03); b.add(new THREE.CylinderGeometry(0.022, 0.026, DR - 0.38, 8).translate(x, 0.3 + (DR - 0.38) / 2, zz), oakL); }
  }
  for (const [x, zz] of [[DX0, DZ0], [DX1, DZ0], [DX0, DZ1], [DX1, DZ1]]) { b.add(boxGeo(V(x - 0.06, 0, zz - 0.06), V(x + 0.06, DR + 0.12, zz + 0.06)), oak); b.add(new THREE.SphereGeometry(0.07, 10, 8).translate(x, DR + 0.18, zz), oakL); }

  // ================= the evidence easel + the painting =================
  const EX = -2.35, EZ = -1.25, EY = 1.55, CW = 0.86, CH = 1.06, EYAW = 0.55;
  const ea = new THREE.Group(); ea.position.set(EX, 0, EZ); ea.rotation.y = EYAW; root.add(ea);
  rod(ea, [-0.45, 0, 0.2], [-0.06, 2.3, -0.05], 0.03, oakL); rod(ea, [0.45, 0, 0.2], [0.06, 2.3, -0.05], 0.03, oakL); rod(ea, [0, 0, -0.6], [0, 2.2, -0.08], 0.028, oakL);
  ea.add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.14).translate(0, EY - CH / 2 - 0.16, 0.06), oakL));
  const PAINT = framedPainting(ea, [0, EY, 0.08], 0, CW, CH, 0.11);
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.12), new THREE.MeshBasicMaterial({ map: ctex("ctTag", 256, 100, (g) => { g.fillStyle = "#f2ead2"; g.fillRect(0, 0, 256, 100); g.strokeStyle = "#8a2a2a"; g.lineWidth = 6; g.strokeRect(4, 4, 248, 92); g.fillStyle = "#8a2a2a"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "EXHIBIT A", 128, 52, 220, 56); }) }));
  tag.position.set(0.32, EY - CH / 2 - 0.25, 0.15); tag.rotation.z = -0.08; ea.add(tag);
  // the PROOF easel (scene 1 + the request): a bare stretcher with the new picture he paints in front of the court
  const PX = -2.25, PZ = 1.55, PYAW = 0.55;
  const proofG = new THREE.Group(); proofG.position.set(PX, 0, PZ); proofG.rotation.y = PYAW; root.add(proofG);
  rod(proofG, [-0.42, 0, 0.18], [-0.05, 2.15, -0.05], 0.028, oakL); rod(proofG, [0.42, 0, 0.18], [0.05, 2.15, -0.05], 0.028, oakL); rod(proofG, [0, 0, -0.55], [0, 2.05, -0.08], 0.026, oakL);
  proofG.add(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.12).translate(0, 1.38 - 0.45 - 0.05, 0.06), oakL));
  const PROOF = framedPainting(proofG, [0, 1.38, 0.08], 0, 0.72, 0.9, 0);

  // ================= the experts' test table (scene 9: c.labOn): microscope, a spirit burner (flame), test-tube rack =================
  const LBX = -3.55, LBZ = -0.2;
  const labG = new THREE.Group(); root.add(labG);
  labG.add(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.7).translate(LBX, 0.88, LBZ), oakL));
  for (const [dx, dz] of [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]]) labG.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.88, 0.06).translate(LBX + dx, 0.44, LBZ + dz), oak));
  { const scope = new THREE.Group(); scope.position.set(LBX - 0.3, 0.91, LBZ); labG.add(scope); const blk = metal("ctScope", "#2a2c36", 60);
    scope.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.16).translate(0, 0.015, 0), blk), new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.05).translate(-0.05, 0.16, -0.04), blk));
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.26, 12), blk); tube.position.set(0.0, 0.32, 0.0); tube.rotation.z = 0.35; scope.add(tube);
    scope.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.1).translate(0.02, 0.12, 0.02), metal("ctStage", "#c9ced8", 80))); }
  labG.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.07, 12).translate(LBX + 0.15, 0.945, LBZ), new THREE.MeshLambertMaterial({ color: "#a8c8d8", transparent: true, opacity: 0.7 })));
  const burnFl = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.09, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color("#8ab8ff").multiplyScalar(1.8) })); burnFl.position.set(LBX + 0.15, 1.03, LBZ); burnFl.layers.set(NOINK); labG.add(burnFl);
  labG.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.08).translate(LBX + 0.45, 0.94, LBZ - 0.1), oakL));
  for (let k = 0; k < 5; k++) labG.add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.15, 8).translate(LBX + 0.33 + k * 0.06, 1.0, LBZ - 0.1), new THREE.MeshLambertMaterial({ color: ["#a8c8d8", "#e8c86a", "#a8c8d8", "#c86a6a", "#a8c8d8"][k], transparent: true, opacity: 0.75 })));
  labG.traverse((o) => { o.castShadow = true; });

  // ================= press benches (right) + public benches (back) =================
  const bench = (x0: number, x1: number, zz: number, yaw = 0) => { const g = new THREE.Group(); g.position.set((x0 + x1) / 2, 0, zz); g.rotation.y = yaw; root.add(g); const w = x1 - x0;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, 0.42).translate(0, 0.46, 0), oakL), new THREE.Mesh(new THREE.BoxGeometry(w, 0.55, 0.06).translate(0, 0.75, 0.2), oak));
    for (const s of [-1, 1]) g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.46, 0.4).translate(s * (w / 2 - 0.04), 0.23, 0), oak)); g.traverse((o) => { o.castShadow = true; }); };
  for (let k = 0; k < 3; k++) bench(2.6, 5.6, -1.4 + k * 1.6, -Math.PI / 2 + 0.35);
  for (let k = 0; k < 3; k++) { bench(-5.2, -1.4, 2.6 + k * 1.1); bench(1.4, 5.2, 2.6 + k * 1.1); }
  // a press table with a typewriter-ish block + papers by the reporters
  b.add(boxGeo(V(2.3, 0.75, -2.6), V(3.6, 0.8, -1.9)), oakL); for (const [x, zz] of [[2.4, -2.5], [3.5, -2.5], [2.4, -2.0], [3.5, -2.0]]) b.add(boxGeo(V(x - 0.03, 0, zz - 0.03), V(x + 0.03, 0.75, zz + 0.03)), oak);
  const papers: THREE.Mesh[] = [];
  for (let k = 0; k < 4; k++) { const pp = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.3).rotateX(-Math.PI / 2), lam("ctPaper", () => ({ color: "#f3ead4", side: THREE.DoubleSide }))); pp.position.set(2.5 + k * 0.28, 0.81, -2.25); pp.rotation.y = (k - 1.5) * 0.2; root.add(pp); papers.push(pp); }

  // ================= portraits on the right wall, a rail of coats, lamps + fans =================
  for (const [zz, k] of [[-0.4, 3], [3.0, 7]] as [number, number][]) { const pp = framedPainting(root, [X1 - 0.08, 3.1, zz], -Math.PI / 2, 0.9, 1.1, 0.1, k); void pp; }
  const pend: THREE.Group[] = [], fans: THREE.Group[] = [];
  for (const [x, zz] of [[-1.8, -0.8], [1.8, 2.2]] as [number, number][]) {
    const g = new THREE.Group(); g.position.set(x, HT, zz); root.add(g); pend.push(g);
    rod(g, [0, 0, 0], [0, -1.3, 0], 0.012, brass);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color("#fff0c8").multiplyScalar(1.6) })); gl.position.y = -1.5; gl.layers.set(NOINK); g.add(gl);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.1, 14), brass); cap.position.y = -1.3; g.add(cap);
    const pl = new THREE.PointLight("#ffd28a", 5, 7, 1.3); pl.position.y = -1.55; g.add(pl); glow(g, [0, -1.5, 0], "#ffe0a0", 1.1, 0.6);
  }
  for (const [x, zz] of [[0, 1.0], [-3.5, -1.6]] as [number, number][]) {
    const g = new THREE.Group(); g.position.set(x, HT - 0.75, zz); root.add(g); fans.push(g);
    rod(root, [x, HT, zz], [x, HT - 0.7, zz], 0.02, brass); g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.14, 14), brass));
    for (let k = 0; k < 4; k++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.015, 0.14).translate(0.42, 0, 0), oakL); bl.rotation.y = (k * TAU) / 4; bl.rotation.x = 0.12; g.add(bl); }
  }
  // a coat rail + umbrella stand by the doors, a flag-less brass rope barrier in front of the bench
  for (const x of [-2.7, -1.0, 1.0, 2.7]) { b.add(new THREE.CylinderGeometry(0.04, 0.06, 0.9, 10).translate(x, 0.45, -2.6), brass); b.add(new THREE.SphereGeometry(0.06, 10, 8).translate(x, 0.93, -2.6), brass); }
  for (const [a, c] of [[-2.7, -1.0], [1.0, 2.7]]) { const n = 12, pts: THREE.Vector3[] = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push(V(a + (c - a) * t, 0.86 - 0.18 * Math.sin(Math.PI * t), -2.6)); } root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.025, 6), redL)); }
  const dust = motes(root, [X0 + 0.5, 0.4, -4], [X0 + 4.5, 4.4, 4.5], 60, "#fff0c8", 0.025, 0.7, 4);
  const streamers: THREE.Mesh[] = [];
  for (let k = 0; k < 40; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.12), new THREE.MeshBasicMaterial({ color: ["#f05a28", "#ffd84a", "#ffffff", "#2f9ad8", "#c0476a"][k % 5], side: THREE.DoubleSide })); m.layers.set(NOINK); m.visible = false; m.userData = { x: -4 + ((k * 37) % 80) / 10, z: -2 + ((k * 53) % 70) / 10, ph: (k * 0.137) % 1, sp: 0.6 + ((k * 7) % 5) / 10 }; root.add(m); streamers.push(m); }
  // warm room fill (sunlight bouncing off the parquet) so the walls read sage + oak, not violet
  for (const [x, zz] of [[-2.5, -1.5], [2.5, 1.5], [0, 4.0]] as [number, number][]) { const fl = new THREE.PointLight("#ffe6c0", 6, 14, 1.1); fl.position.set(x, 4.2, zz); root.add(fl); }
  b.build(root);

  const marks: Record<string, V3> = {
    judge: [0, 0.45, -3.85], dock: [0, 0.1, 0.3], guardL: [-1.3, 0, 0.55], guardR: [1.3, 0, 0.55], easel: [EX + 0.75, 0, EZ + 0.5],
    rep1: [3.0, 0, -0.6], rep2: [3.8, 0, 0.9], rep3: [4.4, 0, -1.6], pub1: [-3.4, 0, 2.2], pub2: [-2.1, 0, 3.3], pub3: [2.4, 0, 2.2], pub4: [3.6, 0, 3.4], pub5: [-0.6, 0, 3.0], pub6: [0.8, 0, 4.2],
    painting: [EX + Math.sin(EYAW) * 0.08, EY, EZ + Math.cos(EYAW) * 0.08], proof: [PX + Math.sin(PYAW) * 0.08, 1.38, PZ + Math.cos(PYAW) * 0.08], proofPainter: [PX + 0.72, 0, PZ + 0.32], lab: [LBX, 0.9, LBZ], sciA: [LBX + 0.55, 0, LBZ + 0.75], sciB: [LBX - 0.65, 0, LBZ + 0.7], gavel: [0.85, 1.63, -3.3], crest: [0, 3.95, Z0 + 0.14],
  };
  const cams = {
    wide: { pos: [0.5, 2.6, 6.2] as V3, look: [0, 1.4, -2.0] as V3, fov: 46 },
    dock: { pos: [0.4, 1.7, 3.4] as V3, look: [0, 1.5, 0.3] as V3, fov: 40 },
    bench: { pos: [0.2, 1.9, 1.2] as V3, look: [0, 2.0, -3.9] as V3, fov: 42 },
    easel: { pos: [-1.0, 1.65, 1.2] as V3, look: [EX, EY, EZ] as V3, fov: 40 },
    press: { pos: [0.6, 1.8, 0.5] as V3, look: [3.6, 1.4, -0.4] as V3, fov: 42 },
  };
  return {
    name: "court", root, marks, cams,
    pose: (t, c) => {
      PAINT.set({ paint: 1, crack: 1, ink: 1, age: 1 });
      PROOF.set({ paint: c.proof ?? 1, wet: c.proof !== undefined && c.proof < 1 ? 1 : 0.6 });
      proofG.visible = (c.proofOn ?? 0) > 0.5; labG.visible = (c.labOn ?? 0) > 0.5; burnFl.scale.set(1, 0.85 + 0.25 * Math.abs(Math.sin(t * 13)), 1);
      const fs = c.fans ?? 1; fans.forEach((g, i) => { g.rotation.y = t * 2.2 * fs + i; });
      pend.forEach((g, i) => { g.rotation.z = 0.012 * Math.sin(t * 0.9 + i * 1.7); g.rotation.x = 0.01 * Math.sin(t * 0.7 + i); });
      papers.forEach((pp, i) => { pp.rotation.z = 0.06 * Math.sin(t * 2.3 + i * 1.3) * Math.max(0, Math.sin(t * 0.8 + i)); });
      dust.update(t);
      lampsOn.forEach((l, i) => { l.intensity = 4 * (0.97 + 0.03 * Math.sin(t * 29 + i)); });
      const po = Math.max(0, Math.min(1, c.payoff ?? 0));
      streamers.forEach((m) => { m.visible = po > 0.01; if (!m.visible) return; const u = (t * 0.22 * m.userData.sp + m.userData.ph) % 1; m.position.set(m.userData.x + 0.3 * Math.sin(t * 2 + m.userData.ph * 9), 5.2 - u * 5.2, m.userData.z); m.rotation.set(t * 3 + m.userData.ph * 6, t * 2, t * 4 * m.userData.sp); });
      void gavel;
    },
  };
};
