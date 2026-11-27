// A modern used-car lot at night (light `carlot`) for the everyday comparison ("like a salesman who admits his car
// has a scratch"). Asphalt with painted bays; the cherry-red hero hatchback parked side-on at the front (x -2..2,
// z -0.5..1.3, front toward +x) with a tiny scratch on its front door (+z side); behind it a row of three shiny
// cartoon cars facing the camera (price tags on the windscreens), a back row with a mechanic's car (hood up), the
// sales cabin "HONEST AL'S MOTORS" with a lit window, an OPEN sign and a chasing bulb border on its roof sign, a
// waving inflatable tube man, feather flags, lamp posts, strings of warm bulbs + bunting overhead, a chain-link fence,
// a road with passing cars and a night skyline with a blinking radio mast and the moon.
//
// Story controls (c): scratchGlow 0..1 makes the scratch sparkle (glints + glow) | bumper 0..1 the hero car's rear
// bumper sags (0..0.45), drops off (0.45..0.75) and settles on the asphalt with a bounce (0.75..1).
// Marks (feet): salesman = by the hero car's front door (left of the scratch) | buyer = right of the scratch |
// kicker = a customer kicking the left row car's front tyre | coupleA / coupleB = a couple browsing the blue van |
// mechanic = at the back-row car with its hood up | customer = by the cabin door (far) | scratch / bumper = prop points.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { ctex, rng } from "../paint";
import { NOINK } from "../ink";
import { glow, shaft, rod, lamp, flicker } from "../setkit";
import { metal, TAU } from "./innerkit_b";
import { stringLights, twinkle, fitText, sparkles, sparkle } from "./portkit_common";
import type { SetDef, V3 } from "./types";

/** keep-out boxes (min, max), set-local */
export const CARLOT_SOLIDS: [V3, V3][] = [
  [[-2.25, 0, -0.55], [2.25, 1.5, 1.35]],     // hero car
  [[-3.5, 0, -6.6], [-1.5, 1.5, -2.6]],       // row car A
  [[-1.0, 0, -6.6], [1.0, 1.5, -2.6]],        // row car B
  [[1.6, 0, -6.7], [3.6, 1.75, -2.5]],        // row car C (van)
  [[-3.6, 0, -11.6], [-1.6, 2.0, -7.5]],      // back-row car D (hood up)
  [[3.3, 0, -11.8], [5.3, 1.5, -7.8]],        // back-row car E
  [[0.8, 0, -12.6], [5.7, 3.9, -9.95]],       // sales cabin + roof sign
  [[-4.6, 0, -9.0], [-3.4, 4.8, -7.8]],       // tube man
  [[-13, 0, -13.7], [13, 2.2, -13.3]],        // fence
  ...([[-4.3, -1.1], [4.4, -1.4], [-4.6, -8.6], [5.9, -7.2]] as [number, number][]).map(([x, z]) => [[x - 0.3, 0, z - 0.3], [x + 0.3, 6.0, z + 0.3]] as [V3, V3]), // lamp posts
];

// ---------------- painted textures ----------------
const asphaltTex = () => ctex("clAsphalt", 1024, 1024, (g, r) => {
  g.fillStyle = "#3c4258"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 9000; i++) { g.fillStyle = r() < 0.5 ? "rgba(20,24,40,0.35)" : "rgba(150,160,190,0.22)"; g.fillRect(r() * 1024, r() * 1024, 2 + r() * 2, 2 + r() * 2); }
  for (let i = 0; i < 16; i++) { const x = r() * 1024, y = r() * 1024, rr = 40 + r() * 120; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, r() < 0.5 ? "rgba(20,20,34,0.3)" : "rgba(120,140,190,0.14)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  g.strokeStyle = "rgba(18,20,32,0.7)"; g.lineWidth = 3;
  for (let i = 0; i < 7; i++) { let x = r() * 1024, y = r() * 1024; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 120; y += (r() - 0.5) * 120; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 5; i++) { g.fillStyle = "rgba(30,24,40,0.35)"; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 30 + r() * 40, 15 + r() * 20, r() * 3, 0, TAU); g.fill(); g.fillStyle = "rgba(120,90,160,0.18)"; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 10, 5, 0, 0, TAU); g.fill(); }
});
const lineTex = () => ctex("clLine", 64, 512, (g, r) => { g.fillStyle = "#f2f0e6"; g.fillRect(0, 0, 64, 512); for (let i = 0; i < 300; i++) { g.fillStyle = "rgba(60,66,90,0.45)"; g.fillRect(r() * 64, r() * 512, 2 + r() * 5, 2 + r() * 5); } });
const glassTex = () => ctex("clGlass", 256, 256, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#6f8fd0"); gr.addColorStop(0.45, "#2b3b78"); gr.addColorStop(1, "#1a2350"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.moveTo(40, 0); g.lineTo(100, 0); g.lineTo(30, 256); g.lineTo(-30, 256); g.closePath(); g.fill();
  g.fillStyle = "rgba(255,255,255,0.18)"; g.beginPath(); g.moveTo(120, 0); g.lineTo(140, 0); g.lineTo(70, 256); g.lineTo(50, 256); g.closePath(); g.fill();
  g.fillStyle = "rgba(255,220,150,0.5)"; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(150 + i * 18, 40 + Math.sin(i) * 8, 4, 0, TAU); g.fill(); } // reflected bulbs
});
const hubTex = () => ctex("clHub", 256, 256, (g) => {
  g.fillStyle = "#cfd6e2"; g.beginPath(); g.arc(128, 128, 126, 0, TAU); g.fill();
  g.fillStyle = "#5a6070"; g.beginPath(); g.arc(128, 128, 110, 0, TAU); g.fill();
  g.fillStyle = "#e6ebf2"; for (let k = 0; k < 5; k++) { g.save(); g.translate(128, 128); g.rotate((k / 5) * TAU); g.beginPath(); g.moveTo(-14, 0); g.lineTo(14, 0); g.lineTo(26, 106); g.lineTo(-26, 106); g.closePath(); g.fill(); g.restore(); }
  g.fillStyle = "#f4f6fa"; g.beginPath(); g.arc(128, 128, 30, 0, TAU); g.fill(); g.fillStyle = "#8a92a4"; g.beginPath(); g.arc(128, 128, 12, 0, TAU); g.fill();
});
const tagTex = (price: string, note: string, bg: string, fg: string) => ctex(`clTag|${price}|${note}|${bg}`, 512, 300, (g) => {
  g.fillStyle = bg; g.strokeStyle = "#2a1a22"; g.lineWidth = 12;
  const rr = 40; g.beginPath(); g.moveTo(rr, 8); g.lineTo(504 - rr, 8); g.quadraticCurveTo(504, 8, 504, 8 + rr); g.lineTo(504, 292 - rr); g.quadraticCurveTo(504, 292, 504 - rr, 292); g.lineTo(rr, 292); g.quadraticCurveTo(8, 292, 8, 292 - rr); g.lineTo(8, 8 + rr); g.quadraticCurveTo(8, 8, rr, 8); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, price, 256, 132, 430, 150, "900 %spx Arial Black, Arial, sans-serif");
  g.fillStyle = "#2a1a22"; fitText(g, note, 256, 240, 400, 54, "900 %spx Arial, sans-serif");
});
const scratchTex = () => ctex("clScratch", 256, 96, (g) => {
  g.strokeStyle = "rgba(255,255,255,0.95)"; g.lineWidth = 6; g.lineCap = "round"; g.lineJoin = "round";
  g.beginPath(); g.moveTo(20, 60); g.lineTo(70, 44); g.lineTo(110, 52); g.lineTo(160, 34); g.lineTo(200, 40); g.lineTo(236, 28); g.stroke();
  g.strokeStyle = "rgba(200,210,230,0.9)"; g.lineWidth = 3; g.beginPath(); g.moveTo(60, 58); g.lineTo(120, 46); g.stroke();
});
const plateTex = () => ctex("clPlate", 256, 64, (g) => { g.fillStyle = "#f4f2ea"; g.fillRect(0, 0, 256, 64); g.strokeStyle = "#2a3a7a"; g.lineWidth = 6; g.strokeRect(3, 3, 250, 58); g.fillStyle = "#2a3a7a"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "4 SALE", 128, 34, 220, 44, "900 %spx Arial, sans-serif"); });
const claddingTex = () => ctex("clCladding", 512, 512, (g) => {
  g.fillStyle = "#e9e4d6"; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 32) { g.fillStyle = "rgba(120,120,150,0.35)"; g.fillRect(x, 0, 4, 512); g.fillStyle = "rgba(255,255,255,0.4)"; g.fillRect(x + 5, 0, 3, 512); }
  g.fillStyle = "#2f6fc0"; g.fillRect(0, 380, 512, 40); g.fillStyle = "#e8b83a"; g.fillRect(0, 420, 512, 12);
});
const signTex = () => ctex("clSignFace", 1024, 220, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 220); gr.addColorStop(0, "#d8303a"); gr.addColorStop(1, "#a01c2a"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 220);
  g.strokeStyle = "#ffd25a"; g.lineWidth = 10; g.strokeRect(14, 14, 996, 192);
  g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 14; g.strokeStyle = "#5a0a14"; g.font = "900 120px Arial Black, Arial, sans-serif";
  let fs = 120; const t = "HONEST AL'S MOTORS"; g.font = `900 ${fs}px Arial Black, Arial, sans-serif`; const w = g.measureText(t).width; if (w > 900) { fs *= 900 / w; g.font = `900 ${fs}px Arial Black, Arial, sans-serif`; }
  g.strokeText(t, 512, 112); g.fillStyle = "#ffe27a"; g.fillText(t, 512, 112);
});
const windowTex = () => ctex("clOfficeWin", 512, 256, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#ffe2a0"); gr.addColorStop(1, "#ffb860"); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  for (let y = 0; y < 256; y += 22) { g.fillStyle = "rgba(200,120,50,0.35)"; g.fillRect(0, y, 512, 8); }
  g.fillStyle = "rgba(90,50,40,0.55)"; g.beginPath(); g.ellipse(170, 200, 60, 70, 0, Math.PI, 0); g.fill(); g.beginPath(); g.arc(170, 110, 34, 0, TAU); g.fill(); // a silhouette at the desk
  g.fillRect(260, 170, 160, 12); g.fillRect(300, 120, 70, 50);
});
const openTex = () => ctex("clOpen", 256, 110, (g) => { g.strokeStyle = "#ff5aa0"; g.lineWidth = 10; g.beginPath(); g.ellipse(128, 55, 116, 46, 0, 0, TAU); g.stroke(); g.fillStyle = "#ff8ac0"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "OPEN", 128, 58, 180, 64, "900 %spx Arial, sans-serif"); });
const skyWin = (seed: number) => ctex("clSkyWin" + seed, 256, 512, (g) => {
  const r = rng(seed); g.fillStyle = "#1c2552"; g.fillRect(0, 0, 256, 512);
  for (let y = 12; y < 512; y += 26) for (let x = 10; x < 256; x += 22) { const lit = r() < 0.32; g.fillStyle = lit ? (r() < 0.7 ? "#ffd27a" : "#cfe4ff") : "#2a3468"; g.fillRect(x, y, 12, 16); }
  g.fillStyle = "#28316a"; g.fillRect(0, 0, 256, 6);
});
const flagTex = (word: string, bg: string, fg: string) => ctex(`clFlag|${word}|${bg}`, 128, 512, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, 128, 512); g.fillStyle = "rgba(255,255,255,0.2)"; g.fillRect(0, 0, 18, 512);
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle"; const n = word.length, step = Math.min(110, 440 / n);
  for (let i = 0; i < n; i++) fitText(g, word[i], 64, 60 + i * step + step / 2 - 30, 100, Math.min(100, step * 0.95), "900 %spx Arial Black, Arial, sans-serif");
});
const tubeTex = () => ctex("clTube", 256, 256, (g) => {
  g.fillStyle = "#ff4a3a"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#ffd23a"; for (let y = 0; y < 256; y += 64) g.fillRect(0, y, 256, 18);
});
const tubeFace = () => ctex("clTubeFace", 512, 256, (g) => {
  g.fillStyle = "#ff4a3a"; g.fillRect(0, 0, 512, 256);
  g.fillStyle = "#ffffff"; for (const x of [210, 300]) { g.beginPath(); g.ellipse(x, 100, 34, 44, 0, 0, TAU); g.fill(); } g.fillStyle = "#1a1420"; for (const x of [216, 306]) { g.beginPath(); g.arc(x, 108, 16, 0, TAU); g.fill(); }
  g.strokeStyle = "#1a1420"; g.lineWidth = 12; g.lineCap = "round"; g.beginPath(); g.arc(256, 150, 60, 0.25, Math.PI - 0.25); g.stroke();
});

// ---------------- the cartoon car ----------------
type CarKind = "hatch" | "sedan" | "suv";
type CarOpts = { col: string; kind: CarKind; tag?: [string, string, string, string]; sideTag?: [string, string, string, string]; hood?: number; key: string };
type Car = { g: THREE.Group; L: number; W: number; bumperR: THREE.Group; wheels: THREE.Group[] };
const roundPoly = (pts: [number, number][], rad: number) => {
  const sh = new THREE.Shape(), n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i - 1 + n) % n], c = pts[(i + 1) % n];
    const da = Math.hypot(a[0] - p[0], a[1] - p[1]), dc = Math.hypot(c[0] - p[0], c[1] - p[1]), k = Math.min(rad, da / 2.2, dc / 2.2);
    const p0: [number, number] = [p[0] + ((a[0] - p[0]) / da) * k, p[1] + ((a[1] - p[1]) / da) * k], p1: [number, number] = [p[0] + ((c[0] - p[0]) / dc) * k, p[1] + ((c[1] - p[1]) / dc) * k];
    if (i === 0) sh.moveTo(...p0); else sh.lineTo(...p0);
    sh.quadraticCurveTo(p[0], p[1], ...p1);
  }
  sh.closePath(); return sh;
};
const insetPoly = (pts: [number, number][], d: number): [number, number][] => {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return pts.map(([x, y]) => { const l = Math.hypot(x - cx, y - cy); return [x - ((x - cx) / l) * d * 1.6, y - ((y - cy) / l) * d]; });
};
const SPEC: Record<CarKind, { L: number; W: number; belt: number; roof: number; ws: number; rf: number; rr: number; rb: number }> = {
  //            length, width, beltline, roof, windscreen base x, roof front x, roof rear x, rear glass base x (all from centre)
  hatch: { L: 3.9, W: 1.78, belt: 0.86, roof: 1.44, ws: 0.82, rf: 0.02, rr: -1.45, rb: -1.78 },
  sedan: { L: 4.4, W: 1.82, belt: 0.84, roof: 1.4, ws: 0.95, rf: 0.2, rr: -0.95, rb: -1.45 },
  suv: { L: 4.2, W: 1.9, belt: 1.0, roof: 1.72, ws: 0.95, rf: 0.45, rr: -1.75, rb: -1.95 },
};
const buildCar = (parent: THREE.Object3D, pos: V3, yaw: number, o: CarOpts): Car => {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = yaw; parent.add(g);
  const S = SPEC[o.kind], L = S.L, W = S.W, yb = 0.26, ra = 0.43, xr = -L / 2 + 0.8, xf = L / 2 - 0.82, bev = 0.1;
  const paint = metal("clPaint" + o.col, o.col, 90), dark = lam("clTrimDark", () => ({ color: "#23263a" })), chrome = metal("clChrome", "#d6dbe6", 110);
  const glassM = new THREE.MeshBasicMaterial({ map: glassTex() });
  // lower body (side profile with wheel arches), extruded across the width with rounded edges
  const sh = new THREE.Shape(); const B = S.belt;
  sh.moveTo(-L / 2 + 0.2, yb); sh.lineTo(xr - ra, yb); sh.absarc(xr, yb, ra, Math.PI, 0, true); sh.lineTo(xf - ra, yb); sh.absarc(xf, yb, ra, Math.PI, 0, true);
  sh.lineTo(L / 2 - 0.22, yb); sh.quadraticCurveTo(L / 2 + 0.03, yb + 0.02, L / 2 + 0.02, yb + 0.3); sh.quadraticCurveTo(L / 2, B - 0.08, L / 2 - 0.25, B - 0.04);
  sh.lineTo(S.ws, B); sh.lineTo(-L / 2 + 0.15, B + 0.02); sh.quadraticCurveTo(-L / 2 - 0.03, B, -L / 2, B - 0.26); sh.lineTo(-L / 2, yb + 0.2); sh.quadraticCurveTo(-L / 2, yb, -L / 2 + 0.2, yb);
  const bg = new THREE.ExtrudeGeometry(sh, { depth: W - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: 0.08, bevelSegments: 4, curveSegments: 14 }); bg.translate(0, 0, -(W - 2 * bev) / 2);
  const body = new THREE.Mesh(bg, paint); body.castShadow = true; body.receiveShadow = true; g.add(body);
  // greenhouse
  const cab: [number, number][] = [[S.rb, B - 0.03], [S.ws, B - 0.03], [S.rf, S.roof], [S.rr, S.roof]];
  const cw = W - 0.36, cg = new THREE.ExtrudeGeometry(roundPoly(cab, 0.18), { depth: cw - 0.12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 3, curveSegments: 6 }); cg.translate(0, 0, -(cw - 0.12) / 2);
  const cabin = new THREE.Mesh(cg, paint); cabin.castShadow = true; g.add(cabin);
  // side glass (both sides) with a B-pillar
  const gp = insetPoly(cab, 0.075);
  for (const s of [-1, 1]) {
    const gm = new THREE.Mesh(new THREE.ShapeGeometry(roundPoly(gp, 0.1)), glassM); gm.position.z = s * (cw / 2 + 0.002); if (s < 0) gm.rotation.y = Math.PI, gm.scale.x = -1; g.add(gm);
    const bp = new THREE.Mesh(new THREE.BoxGeometry(0.09, S.roof - B, 0.02), paint); bp.position.set((S.rf + S.rr) / 2 + 0.1, (S.roof + B) / 2, s * (cw / 2 + 0.008)); g.add(bp);
  }
  // windscreen + rear glass quads (slightly proud of the cabin)
  const pane = (a: [number, number], b: [number, number], inset: number) => {
    const d = V(b[0] - a[0], b[1] - a[1], 0), len = d.length(); d.normalize(); const n = V(d.y, -d.x, 0); if (n.x * (a[0] + b[0]) < 0 && Math.abs(n.x) > 0.2) n.negate(); if (n.y < 0) n.negate();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(cw - 0.1, len - inset), glassM);
    const z = n.clone(), y = d.clone(), x = new THREE.Vector3().crossVectors(y, z);
    m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0).addScaledVector(n, 0.07); g.add(m);
    return { m, n, d, x, mid: m.position.clone(), len };
  };
  const ws = pane([S.ws - 0.05, B + 0.02], [S.rf + 0.05, S.roof - 0.03], 0.1);
  pane([S.rr - 0.02, S.roof - 0.03], [S.rb + 0.04, B + 0.02], 0.1);
  if (o.tag) { const [p, nt, bgc, fg] = o.tag; const t = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.36), new THREE.MeshBasicMaterial({ map: tagTex(p, nt, bgc, fg) })); t.quaternion.copy(ws.m.quaternion); t.position.copy(ws.mid).addScaledVector(ws.n, 0.012).addScaledVector(ws.d, -ws.len * 0.18); t.rotateZ(0.06); g.add(t); }
  if (o.sideTag) { const [p, nt, bgc, fg] = o.sideTag; const t = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.25), new THREE.MeshBasicMaterial({ map: tagTex(p, nt, bgc, fg) })); t.position.set(S.rr + 0.5, B + 0.2, cw / 2 + 0.01); t.rotation.z = -0.05; g.add(t); }
  // wheels: tyre + spoked hub (separate meshes, both sides)
  const tyreM = lam("clTyre", () => ({ color: "#1e2030" })), hubM = lam("clHubM", () => ({ map: hubTex() }));
  const wheels: THREE.Group[] = [];
  for (const x of [xr, xf]) for (const s of [-1, 1]) {
    const wg = new THREE.Group(); wg.position.set(x, 0.33, s * (W / 2 - 0.16)); g.add(wg); wheels.push(wg);
    const ty = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.24, 24).rotateX(Math.PI / 2), tyreM); ty.castShadow = true; wg.add(ty);
    const tr = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.045, 8, 24), tyreM); tr.position.z = s * 0.11; wg.add(tr);
    const hub = new THREE.Mesh(new THREE.CircleGeometry(0.21, 24), hubM); hub.position.z = s * 0.125; if (s < 0) hub.rotation.y = Math.PI; wg.add(hub);
  }
  // nose + tail: lamps, grille, bumpers, plates, mirrors, door lines + handles, shine streaks
  const head = new THREE.MeshBasicMaterial({ color: new THREE.Color("#fff2c8").multiplyScalar(1.6) }), tail = new THREE.MeshBasicMaterial({ color: new THREE.Color("#ff3a40").multiplyScalar(1.3) });
  for (const s of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 10), head); h.scale.set(0.4, 0.75, 1.1); h.position.set(L / 2 - 0.01, B - 0.2, s * (W / 2 - 0.3)); h.layers.set(NOINK); g.add(h);
    const hr = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 6, 20).rotateY(Math.PI / 2), chrome); hr.scale.set(1, 0.75, 1.1); hr.position.copy(h.position); g.add(hr);
    const tl = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), tail); tl.scale.set(0.35, 1.0, 0.9); tl.position.set(-L / 2 - 0.01, B - 0.18, s * (W / 2 - 0.22)); tl.layers.set(NOINK); g.add(tl);
    const mir = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.1, 0.12, 2, 0.03), paint); mir.position.set(S.ws - 0.08, B + 0.1, s * (W / 2 + 0.03)); g.add(mir);
    const dh = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.035, 0.03, 2, 0.012), chrome); dh.position.set(S.ws - 0.55, B - 0.12, s * (W / 2 + 0.012)); g.add(dh);
    const dh2 = dh.clone(); dh2.position.x = (S.rf + S.rr) / 2 - 0.2; g.add(dh2);
    for (const x of [S.ws - 0.05, (S.rf + S.rr) / 2 + 0.1]) { const ln = new THREE.Mesh(new THREE.BoxGeometry(0.012, B - yb - 0.1, 0.006), dark); ln.position.set(x, (B + yb + 0.1) / 2 - 0.02, s * (W / 2 + 0.003)); g.add(ln); }
    const shine = new THREE.Mesh(new THREE.PlaneGeometry(L * 0.62, 0.035), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.45, depthWrite: false })); shine.position.set(0.1, B - 0.08, s * (W / 2 + 0.006)); if (s < 0) shine.rotation.y = Math.PI; shine.layers.set(NOINK); g.add(shine);
  }
  const grille = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.14, W * 0.42, 2, 0.03), dark); grille.position.set(L / 2 + 0.04, yb + 0.3, 0); g.add(grille);
  const bumpM = lam("clBumper", () => ({ color: "#2c3044" }));
  const bf = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.17, W + 0.02, 3, 0.07), bumpM); bf.position.set(L / 2 + 0.06, yb + 0.06, 0); bf.castShadow = true; g.add(bf);
  const plateM = new THREE.MeshBasicMaterial({ map: plateTex() });
  const pf = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.11), plateM); pf.position.set(L / 2 + 0.152, yb + 0.07, 0); pf.rotation.y = Math.PI / 2; g.add(pf);
  // rear bumper: its own group pivoting at the far (-z) end so the near end sags toward the camera side
  const bumperR = new THREE.Group(); bumperR.position.set(-L / 2 - 0.06, yb + 0.06, -(W + 0.02) / 2); g.add(bumperR);
  { const br = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.17, W + 0.02, 3, 0.07), bumpM); br.position.z = (W + 0.02) / 2; br.castShadow = true; bumperR.add(br);
    const pr = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.11), plateM); pr.position.set(-0.092, 0.01, (W + 0.02) / 2); pr.rotation.y = -Math.PI / 2; bumperR.add(pr); }
  const hs = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.05).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.35, depthWrite: false })); hs.position.set(S.ws + 0.4, B + 0.012, 0.15); hs.rotation.y = 0.3; hs.layers.set(NOINK); g.add(hs);
  if (o.hood) { // raised hood (mechanic's car): the hood panel hinged at the windscreen, engine block showing
    const hg = new THREE.Group(); hg.position.set(S.ws - 0.02, B + 0.03, 0); hg.rotation.z = o.hood; g.add(hg);
    const hp = new THREE.Mesh(new RoundedBoxGeometry(L / 2 - S.ws + 0.1, 0.05, W - 0.15, 2, 0.02), paint); hp.position.set((L / 2 - S.ws + 0.1) / 2, 0, 0); hg.add(hp);
    const eng = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.2, W - 0.5, 2, 0.04), lam("clEngine", () => ({ color: "#4a5068" }))); eng.position.set((S.ws + L / 2) / 2, B + 0.02, 0); g.add(eng);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 12), lam("clEngineCap", () => ({ color: "#e8b83a" }))); cap.position.set((S.ws + L / 2) / 2 + 0.1, B + 0.15, 0.3); g.add(cap);
    rod(g, [S.ws + 0.05, B + 0.03, 0.6], [S.ws + 0.25, B + 0.55, 0.6], 0.012, chrome);
  }
  return { g, L, W, bumperR, wheels };
};

// ---------------- the set ----------------
export const carlot = (): SetDef => {
  const root = new THREE.Group(), b = new Batch(), r = rng(2025);
  // ---- ground: asphalt, bay lines, a curb + sidewalk at the front ----
  const asphalt = lam("clAsphaltM", () => ({ map: asphaltTex() }));
  b.add(quad(V(-40, 0, 9), V(40, 0, 9), V(40, 0, -13.5), V(-40, 0, -13.5), 20, 5.6), asphalt);
  b.add(boxGeo(V(-40, 0, 9), V(40, 0.15, 9.3)), lam("clCurb", () => ({ color: "#a8acbc" })));
  b.add(quad(V(-40, 0.15, 12), V(40, 0.15, 12), V(40, 0.15, 9.3), V(-40, 0.15, 9.3), 40, 1.4), lam("clSidewalk", () => ({ color: "#8a8fa6" })));
  const lineM = lam("clLineM", () => ({ map: lineTex() }));
  const stripe = (x0: number, z0: number, x1: number, z1: number, w = 0.12) => { const d = V(x1 - x0, 0, z1 - z0), n = V(-d.z, 0, d.x).normalize().multiplyScalar(w / 2); b.add(quad(V(x0 - n.x, 0.006, z0 - n.z), V(x1 - n.x, 0.006, z1 - n.z), V(x1 + n.x, 0.006, z1 + n.z), V(x0 + n.x, 0.006, z0 + n.z), 1, d.length() / 2), lineM); };
  for (const x of [-3.8, -1.25, 1.3, 3.9]) stripe(x, -2.3, x, -7.0);
  for (const x of [-4.0, -1.4, 2.2, 6.2]) stripe(x, -7.6, x, -12.0);
  stripe(-4.5, 2.4, 4.5, 2.4); // front display line
  // display spot: painted star under the hero car's front
  // warm fill from the bulb strings onto the hero car's camera side
  { const f1 = new THREE.PointLight("#ffc890", 7, 10, 1.3); f1.position.set(0.6, 3.4, 4.6); root.add(f1); const f2 = new THREE.PointLight("#ffd8a8", 3, 6, 1.4); f2.position.set(-2.8, 1.2, 3.2); root.add(f2); }
  // ---- the cars ----
  const hero = buildCar(root, [0, 0, 0.4], 0, { col: "#ff2a26", kind: "hatch", key: "hero", sideTag: ["$5,995", "LIKE NEW!", "#ffe14a", "#c8102e"] });
  buildCar(root, [-2.5, 0, -4.6], -Math.PI / 2, { col: "#1fb5a8", kind: "hatch", key: "a", tag: ["$3,450", "ONE OWNER", "#ffe14a", "#1a7a70"] });
  buildCar(root, [0.0, 0, -4.6], -Math.PI / 2, { col: "#f2b41e", kind: "sedan", key: "b", tag: ["$4,200", "GREAT DEAL", "#ffffff", "#c8102e"] });
  buildCar(root, [2.6, 0, -4.6], -Math.PI / 2, { col: "#3a7ae0", kind: "suv", key: "c", tag: ["$7,999", "LOW MILES", "#ffe14a", "#2a4aa0"] });
  buildCar(root, [-2.6, 0, -9.6], -Math.PI / 2, { col: "#8a4ad8", kind: "sedan", key: "d", hood: -1.1 });
  buildCar(root, [4.3, 0, -9.8], -Math.PI / 2, { col: "#7ac23a", kind: "hatch", key: "e", tag: ["$2,999", "AS IS", "#ffffff", "#2a7a2a"] });
  // the scratch on the hero car's front door (+z side) + its sparkle
  const SCX = 0.42, SCY = 0.66, SCZ = 0.4 + hero.W / 2 + 0.006;
  const scratch = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.075), new THREE.MeshBasicMaterial({ map: scratchTex(), transparent: true, depthWrite: false })); scratch.position.set(SCX, SCY, SCZ); scratch.layers.set(NOINK); root.add(scratch);
  const scrSp = sparkles(root, 5, [SCX, SCY - 0.05, SCZ + 0.03], 0.24, 0.1, 0.02, 77, 0.38);
  const scrGlow = glow(root, [SCX, SCY, SCZ + 0.05], "#dfe8ff", 0.6, 0.0);
  // balloons tied to the van's mirror (bob in the breeze)
  const balloons = ["#ff4a6a", "#ffd23a", "#3ad0ff"].map((c, i) => {
    const bg = new THREE.Group(); bg.position.set(2.6 + 1.0, 1.25, -4.6 + 1.0); root.add(bg);
    const bl = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), metal("clBalloon" + c, c, 100)); bl.scale.set(1, 1.18, 1); bl.position.set((i - 1) * 0.22, 1.1 + (i % 2) * 0.18, 0); bg.add(bl);
    rod(bg, [0, 0, 0], [(i - 1) * 0.22, 0.9 + (i % 2) * 0.18, 0], 0.004, lam("clString", () => ({ color: "#f0f0f0" })));
    return bg;
  });
  // ---- the sales cabin + roof sign with a chasing bulb border ----
  const OX0 = 1.0, OX1 = 5.5, OZ0 = -12.5, OZ1 = -10.0, OH = 2.7;
  const clad = lam("clCladM", () => ({ map: claddingTex() }));
  b.add(boxGeo(V(OX0, 0.2, OZ0), V(OX1, OH, OZ1), 3), clad);
  b.add(boxGeo(V(OX0 - 0.1, OH, OZ0 - 0.1), V(OX1 + 0.1, OH + 0.12, OZ1 + 0.1)), lam("clCabRoof", () => ({ color: "#4a5068" })));
  for (const x of [OX0 + 0.2, OX1 - 0.2]) b.add(boxGeo(V(x - 0.15, 0, OZ1 - 0.5), V(x + 0.15, 0.2, OZ1 - 0.2)), lam("clBlock", () => ({ color: "#7a7e90" })));
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9), new THREE.MeshBasicMaterial({ map: windowTex(), color: new THREE.Color(1.25, 1.2, 1.1) })); win.position.set(3.85, 1.45, OZ1 + 0.01); root.add(win);
  b.add(boxGeo(V(2.9, 0.95, OZ1), V(4.8, 1.0, OZ1 + 0.1)), lam("clSill", () => ({ color: "#f4f2ea" })));
  const winGlow = glow(root, [3.85, 1.45, OZ1 + 0.5], "#ffc070", 3.0, 0.5);
  const winL = new THREE.PointLight("#ffb860", 5, 7, 1.4); winL.position.set(3.85, 1.4, OZ1 + 0.8); root.add(winL);
  const openS = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.22), new THREE.MeshBasicMaterial({ map: openTex(), transparent: true, color: new THREE.Color(1.8, 1.4, 1.6), depthWrite: false })); openS.position.set(3.3, 1.65, OZ1 + 0.02); openS.layers.set(NOINK); root.add(openS);
  const openGlow = glow(root, [3.3, 1.65, OZ1 + 0.1], "#ff6ab0", 0.9, 0.7);
  const door = lam("clDoor", () => ({ color: "#2f6fc0" }));
  b.add(boxGeo(V(1.35, 0.2, OZ1), V(2.25, 2.25, OZ1 + 0.04)), door);
  b.add(boxGeo(V(1.25, 0, OZ1), V(2.35, 0.2, OZ1 + 0.6)), lam("clStep", () => ({ color: "#8a8fa6" })));
  const doorWin = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), new THREE.MeshBasicMaterial({ map: windowTex() })); doorWin.position.set(1.8, 1.65, OZ1 + 0.045); root.add(doorWin);
  const porch = lamp(root, [1.8, 2.42, OZ1 + 0.3], "#ffcf88", 3, 5, "wall");
  const signG = new THREE.Group(); signG.position.set(3.25, OH + 0.68, OZ1 - 0.25); root.add(signG);
  const SW = 4.2, SH = 0.9;
  signG.add(new THREE.Mesh(new THREE.BoxGeometry(SW + 0.2, SH + 0.2, 0.14), lam("clSignFrame", () => ({ color: "#f4f2ea" }))));
  { const face = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: signTex() })); face.position.z = 0.072; signG.add(face); }
  for (const x of [-1.5, 1.5]) rod(root, [3.25 + x, OH + 0.1, OZ1 - 0.3], [3.25 + x, OH + 0.3, OZ1 - 0.3], 0.05, lam("clCabRoof", () => ({ color: "#4a5068" })));
  const marquee: THREE.Mesh[] = [];
  { const per = 2 * (SW + SH + 0.2), n = 40; for (let i = 0; i < n; i++) { let d = (i / n) * per; let x = 0, y = 0; const hw = SW / 2 + 0.06, hh = SH / 2 + 0.06; if (d < 2 * hw) { x = -hw + d; y = hh; } else if ((d -= 2 * hw) < 2 * hh) { x = hw; y = hh - d; } else if ((d -= 2 * hh) < 2 * hw) { x = hw - d; y = -hh; } else { d -= 2 * hw; x = -hw; y = -hh + d; } const m = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: "#fff0b0" })); m.position.set(x, y, 0.08); m.layers.set(NOINK); signG.add(m); marquee.push(m); } }
  const signGlow = glow(signG, [0, 0, 0.3], "#ff8a5a", 5.5, 0.3);
  // ---- lamp posts (LED heads), strings of bulbs + bunting ----
  const POST_H = 5.6, pole = metal("clPole", "#5a6078", 40);
  const posts: [number, number][] = [[-4.3, -1.1], [4.4, -1.4], [-4.6, -8.6], [5.9, -7.2]];
  const postLights = posts.map(([x, z], i) => {
    b.add(new THREE.CylinderGeometry(0.07, 0.11, POST_H, 10).translate(x, POST_H / 2, z), pole);
    b.add(new THREE.CylinderGeometry(0.22, 0.26, 0.4, 10).translate(x, 0.2, z), lam("clPostBase", () => ({ color: "#d8d8e0" })));
    const dir = x < 0 ? 1 : -1;
    b.add(new THREE.BoxGeometry(0.9, 0.06, 0.08).translate(x + dir * 0.4, POST_H - 0.05, z), pole);
    b.add(new RoundedBoxGeometry(0.6, 0.12, 0.3, 2, 0.04).translate(x + dir * 0.8, POST_H - 0.1, z), pole);
    const led = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.22).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color("#fff4dc").multiplyScalar(2.2) })); led.position.set(x + dir * 0.8, POST_H - 0.17, z); led.layers.set(NOINK); root.add(led);
    const L = new THREE.PointLight("#ffe2b8", 9, 15, 1.3); L.position.set(x + dir * 0.8, POST_H - 0.4, z); root.add(L);
    const gl = glow(root, [x + dir * 0.8, POST_H - 0.2, z], "#ffe8c0", 2.4, 0.8);
    shaft(root, [x + dir * 0.8, POST_H - 0.2, z], [x + dir * 1.3, 0, z + 0.4], 2.4, "#ffe8c0", 0.05);
    return { L, gl, seed: i * 1.7 };
  });
  const cols = ["#ffd27a", "#ffb04a", "#ffe7a0", "#ff8a5a", "#ffd27a"];
  const PT = (i: number): V3 => [posts[i][0], POST_H - 0.6, posts[i][1]];
  const signTop: V3 = [3.25, OH + 1.2, OZ1 - 0.25];
  const strings = [stringLights(root, PT(0), PT(1), 0.9, 22, "", cols), stringLights(root, PT(0), PT(3), 1.1, 24, "", cols), stringLights(root, PT(1), PT(2), 1.2, 26, "", cols), stringLights(root, PT(2), PT(3), 0.9, 22, "", cols), stringLights(root, PT(2), signTop, 0.6, 14, "", cols)];
  const flagCols = ["#ff3a4a", "#ffd23a", "#2f8af0", "#f4f2ea", "#3ac46a"];
  const bunting: THREE.Mesh[] = [];
  const bunt = (a: V3, c: V3, sag: number, n: number) => {
    const A = V(...a), C = V(...c), P = (u: number) => A.clone().lerp(C, u).add(V(0, -sag * 4 * u * (1 - u), 0));
    rod(root, a, c, 0.006, lam("clBuntCord", () => ({ color: "#e8e4dc" })));
    for (let i = 1; i < n; i++) {
      const p = P(i / n), m = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([V(-0.14, 0, 0), V(0.14, 0, 0), V(0, -0.32, 0)]), lam("clFlag" + (i % 5), () => ({ color: flagCols[i % 5], side: THREE.DoubleSide })));
      m.geometry.computeVertexNormals(); m.position.copy(p); m.lookAt(p.x + (C.z - A.z), p.y, p.z - (C.x - A.x)); m.userData.ph = i * 0.9 + a[0]; root.add(m); bunting.push(m);
    }
  };
  bunt([posts[0][0], POST_H - 1.25, posts[0][1]], [posts[1][0], POST_H - 1.25, posts[1][1]], 0.5, 22);
  bunt([posts[0][0], POST_H - 1.25, posts[0][1]], [posts[2][0], POST_H - 1.25, posts[2][1]], 0.45, 16);
  bunt([posts[1][0], POST_H - 1.25, posts[1][1]], [posts[3][0], POST_H - 1.25, posts[3][1]], 0.45, 14);
  // ---- inflatable tube man (left, mid depth) + feather flags ----
  const TMX = -4.0, TMZ = -8.4;
  b.add(new RoundedBoxGeometry(0.7, 0.4, 0.7, 2, 0.06).translate(TMX, 0.2, TMZ), lam("clBlower", () => ({ color: "#3a4058" })));
  const tubeM = lam("clTubeM", () => ({ map: tubeTex() })), faceM = lam("clTubeFaceM", () => ({ map: tubeFace() }));
  const segs: THREE.Group[] = []; let prev: THREE.Object3D = root; const SEG = 0.5;
  for (let i = 0; i < 8; i++) {
    const sg = new THREE.Group(); if (i === 0) sg.position.set(TMX, 0.4, TMZ); else sg.position.set(0, SEG, 0); prev.add(sg);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.26 - i * 0.008, 0.27 - i * 0.008, SEG + 0.04, 16).translate(0, SEG / 2, 0), i === 6 ? [tubeM, faceM, faceM] : tubeM); if (i === 6) { m.material = [faceM, tubeM, tubeM]; m.rotation.y = -Math.PI / 2; }
    m.castShadow = true; sg.add(m); segs.push(sg); prev = sg;
  }
  { const hair = new THREE.Group(); hair.position.y = SEG; segs[7].add(hair); for (let k = 0; k < 7; k++) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.4, 6).translate(0, 0.2, 0), lam("clTubeHair", () => ({ color: "#ffd23a" }))); h.rotation.z = (k - 3) * 0.3; hair.add(h); } }
  const arms: THREE.Group[][] = [-1, 1].map((s) => { const out: THREE.Group[] = []; let p: THREE.Object3D = segs[5]; for (let k = 0; k < 4; k++) { const a = new THREE.Group(); if (k === 0) { a.position.set(s * 0.22, SEG * 0.6, 0); a.rotation.z = -s * 1.2; } else a.position.set(0, 0.32, 0); p.add(a); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.34, 10).translate(0, 0.17, 0), tubeM); a.add(m); out.push(a); p = a; } return out; });
  const flags = ([[-5.6, -3.5, "SALE", "#ff3a4a", "#ffffff"], [5.4, -4.0, "DEALS", "#2f8af0", "#ffe14a"], [-5.2, 3.6, "WOW!", "#ffd23a", "#c8102e"], [6.2, 2.8, "SALE", "#3ac46a", "#ffffff"]] as const).map(([x, z, w, bg, fg]) => {
    rod(root, [x, 0, z], [x, 3.3, z], 0.025, pole);
    b.add(new THREE.CylinderGeometry(0.2, 0.24, 0.12, 12).translate(x, 0.06, z), lam("clFlagBase", () => ({ color: "#2a2e40" })));
    const geo = new THREE.PlaneGeometry(0.62, 2.5, 8, 16); geo.translate(0.31, 1.95, 0);
    const m = new THREE.Mesh(geo, lam("clFlagM" + w + bg, () => ({ map: flagTex(w, bg, fg), side: THREE.DoubleSide }))); m.position.set(x, 0, z); m.rotation.y = -0.3 + (x > 0 ? Math.PI : 0) * 0 + (x > 0 ? 0.4 : 0); root.add(m);
    const base = Float32Array.from(geo.attributes.position.array as Float32Array);
    return { m, base, ph: x };
  });
  // ---- props: cones, tyre stack, A-frame sign, planter, bench ----
  for (const [x, z] of [[-3.1, 1.9], [3.7, 0.4], [-0.6, -7.2], [-1.35, 3.9], [-0.95, 4.3], [2.95, 4.6]] as [number, number][]) { b.add(new THREE.ConeGeometry(0.15, 0.55, 14).translate(x, 0.3, z), lam("clCone", () => ({ color: "#ff7a1a" }))); b.add(new THREE.CylinderGeometry(0.135, 0.12, 0.08, 14).translate(x, 0.3, z), lam("clConeBand", () => ({ color: "#f4f2ea" }))); b.add(new THREE.BoxGeometry(0.34, 0.04, 0.34).translate(x, 0.02, z), lam("clCone", () => ({ color: "#ff7a1a" }))); }
  for (let k = 0; k < 4; k++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.11, 10, 22).rotateX(Math.PI / 2), lam("clTyre", () => ({ color: "#1e2030" }))); t.position.set(-0.9, 0.11 + k * 0.21, -11.4); t.rotation.y = k * 0.4; t.castShadow = true; root.add(t); }
  { const af = new THREE.Group(); af.position.set(2.55, 0, 3.4); af.rotation.y = -0.35; root.add(af);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.85), new THREE.MeshBasicMaterial({ map: ctex("clAFrame", 256, 360, (g) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, 256, 360); g.strokeStyle = "#c8102e"; g.lineWidth = 14; g.strokeRect(7, 7, 242, 346); g.fillStyle = "#c8102e"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "NO", 128, 80, 200, 90, "900 %spx Arial Black, Arial, sans-serif"); fitText(g, "CREDIT?", 128, 160, 210, 60, "900 %spx Arial Black, Arial, sans-serif"); g.fillStyle = "#2a3a7a"; fitText(g, "NO", 128, 235, 200, 70, "900 %spx Arial Black, Arial, sans-serif"); fitText(g, "PROBLEM!", 128, 300, 210, 54, "900 %spx Arial Black, Arial, sans-serif"); }), side: THREE.DoubleSide })); p.position.set(0, 0.42, s * 0.12); p.rotation.x = s * 0.16; if (s < 0) p.rotation.y = Math.PI; af.add(p); } }
  { b.add(boxGeo(V(4.75, 0, OZ1 + 0.1), V(5.35, 0.45, OZ1 + 0.7)), lam("clPlanter", () => ({ color: "#c0603a" }))); for (let k = 0; k < 5; k++) b.add(new THREE.SphereGeometry(0.2, 10, 8).translate(4.85 + (k % 3) * 0.2, 0.6 + (k > 2 ? 0.2 : 0), OZ1 + 0.4), lam("clShrub", () => ({ color: "#3a9a4a" }))); }
  { const bench = lam("clBench", () => ({ color: "#2f6fc0" })); b.add(boxGeo(V(-1.9, 0.42, -12.9), V(-0.3, 0.48, -12.5)), bench); b.add(boxGeo(V(-1.9, 0.5, -12.95), V(-0.3, 0.85, -12.9)), bench); for (const x of [-1.8, -0.4]) b.add(boxGeo(V(x - 0.04, 0, -12.9), V(x + 0.04, 0.42, -12.5)), pole); }
  // ---- fence, road with passing cars, skyline, radio mast, moon ----
  const FZ = -13.5;
  for (let x = -14; x <= 14; x += 2.5) b.add(new THREE.CylinderGeometry(0.04, 0.04, 2.1, 8).translate(x, 1.05, FZ), pole);
  b.add(new THREE.CylinderGeometry(0.03, 0.03, 28, 8).rotateZ(Math.PI / 2).translate(0, 2.08, FZ), pole);
  { const mesh = new THREE.Mesh(new THREE.PlaneGeometry(28, 2.0), new THREE.MeshBasicMaterial({ map: (() => { const t = ctex("clChain", 128, 128, (g) => { g.strokeStyle = "rgba(170,180,210,0.9)"; g.lineWidth = 5; for (let k = -128; k < 256; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 128, 128); g.stroke(); g.beginPath(); g.moveTo(k + 128, 0); g.lineTo(k, 128); g.stroke(); } }); const c = t.clone(); c.repeat.set(70, 5); c.needsUpdate = true; return c; })(), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide })); mesh.position.set(0, 1.05, FZ); mesh.layers.set(NOINK); root.add(mesh); }
  b.add(quad(V(-60, -0.02, -13.6), V(60, -0.02, -13.6), V(60, -0.02, -22), V(-60, -0.02, -22), 15, 2), lam("clRoad", () => ({ map: asphaltTex() })));
  for (let x = -58; x < 60; x += 4) b.add(quad(V(x, -0.01, -17.75), V(x + 2, -0.01, -17.75), V(x + 2, -0.01, -17.9), V(x, -0.01, -17.9)), lam("clRoadLine", () => ({ color: "#e8d27a" })));
  b.add(quad(V(-60, -0.02, -22), V(60, -0.02, -22), V(60, -0.02, -200), V(-60, -0.02, -200), 30, 40), lam("clFarGround", () => ({ color: "#242a4a" })));
  const passers = [0, 1, 2].map((i) => {
    const g = new THREE.Group(); root.add(g); const dirn = i % 2 ? -1 : 1, zl = dirn > 0 ? -16.6 : -19.0;
    const bd = new THREE.Mesh(new RoundedBoxGeometry(3.8, 0.9, 1.7, 3, 0.25), metal("clPasser" + i, ["#5a6078", "#2a3a6a", "#7a3a4a"][i], 60)); bd.position.y = 0.6; g.add(bd);
    const top = new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.6, 1.5, 3, 0.2), metal("clPasser" + i, ["#5a6078", "#2a3a6a", "#7a3a4a"][i], 60)); top.position.set(-0.2, 1.25, 0); g.add(top);
    for (const s of [-1, 1]) { glow(g, [dirn * 1.95, 0.6, s * 0.6], "#fff2c8", 1.6, 1); glow(g, [-dirn * 1.95, 0.65, s * 0.6], "#ff3a3a", 0.9, 0.9); }
    const beamS = shaft(g, [dirn * 2.0, 0.6, 0], [dirn * 7.0, 0.0, 0], 2.0, "#fff2c8", 0.07);
    g.position.set(0, 0, zl); g.userData = { dirn, ph: i * 33 }; void beamS; return g;
  });
  const skyB = new Batch();
  for (let i = 0; i < 30; i++) {
    const x = -75 + i * 5.2 + r() * 2, z = -80 - r() * 60, w = 6 + r() * 8, h = 12 + r() * 45 * (Math.abs(x) < 30 ? 1.2 : 0.75), d = 6 + r() * 6;
    const m = new THREE.MeshBasicMaterial({ map: (() => { const t = skyWin(1 + (i % 5)).clone(); t.repeat.set(w / 3, h / 6); t.needsUpdate = true; return t; })() });
    const mm = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); mm.position.set(x, h / 2 - 0.5, z); root.add(mm);
    if (r() < 0.3) skyB.add(new THREE.BoxGeometry(w * 0.4, 2.5, d * 0.4).translate(x, h + 0.75, z), lam("clRoofBox", () => ({ color: "#1a2048" })));
  }
  skyB.build(root, false);
  rod(root, [12, 0, -70], [12, 62, -70], 0.4, lam("clMast", () => ({ color: "#3a4270" })));
  const mastLight = glow(root, [12, 62.5, -70], "#ff3a3a", 5, 1.2);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex("clMoon", 128, 128, (g) => { g.fillStyle = "#f8f2dc"; g.beginPath(); g.arc(64, 64, 60, 0, TAU); g.fill(); g.fillStyle = "rgba(200,190,170,0.5)"; for (const [x, y, rr] of [[44, 50, 12], [80, 76, 9]]) { g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); } }), color: new THREE.Color(1.5, 1.5, 1.45), fog: false, transparent: true }));
  moon.scale.setScalar(9); moon.position.set(-22, 58, -150); moon.layers.set(NOINK); root.add(moon); glow(root, [-22, 58, -150.5], "#a8b8ff", 40, 0.45);
  b.build(root);

  const marks: Record<string, V3> = {
    salesman: [-0.3, 0, 1.75], buyer: [1.2, 0, 1.95], kicker: [-1.2, 0, -3.25], coupleA: [2.35, 0, -2.15], coupleB: [3.0, 0, -2.3],
    mechanic: [-2.6, 0, -7.1], customer: [0.6, 0, -9.3], scratch: [SCX, SCY, SCZ], bumper: [-2.05, 0.32, 0.4], hero: [0, 0, 0.4],
  };
  const cams = {
    wide: { pos: [1.3, 1.85, 9.0] as V3, look: [0.4, 1.3, -3.6] as V3, fov: 42 },
    medium: { pos: [0.45, 1.5, 6.4] as V3, look: [0.45, 1.08, 1.2] as V3, fov: 42 },
    low: { pos: [-2.0, 0.34, 4.8] as V3, look: [0.2, 1.6, 0.2] as V3, fov: 44 },
    high: { pos: [3.4, 6.4, 7.2] as V3, look: [0.2, 0.3, -1.0] as V3, fov: 42 },
    scratch: { pos: [0.62, 0.95, 2.4] as V3, look: [0.42, 0.66, 1.3] as V3, fov: 30 },
    bumper: { pos: [-3.3, 0.9, 3.4] as V3, look: [-2.1, 0.38, 0.8] as V3, fov: 38 },
  };
  const cl01 = (x: number) => Math.max(0, Math.min(1, x));
  return {
    name: "carlot", root, marks, cams,
    pose: (t, c) => {
      strings.forEach((s) => twinkle(s.glows, t));
      bunting.forEach((m) => { m.rotation.x = 0.25 * Math.sin(t * 3.1 + m.userData.ph); });
      postLights.forEach((p) => { p.L.intensity = 9 * (0.97 + 0.03 * Math.sin(t * 40 + p.seed)); });
      marquee.forEach((m, i) => { const on = ((i + Math.floor(t * 8)) % 4) < 2; (m.material as THREE.MeshBasicMaterial).color.setRGB(on ? 2.4 : 0.7, on ? 2.1 : 0.55, on ? 1.2 : 0.35); });
      (signGlow.material as THREE.SpriteMaterial).opacity = 0.85 + 0.15 * Math.sin(t * 4);
      const fl = (Math.sin(t * 23) > 0.96 ? 0.4 : 1); (openGlow.material as THREE.SpriteMaterial).opacity = 0.7 * fl; (openS.material as THREE.MeshBasicMaterial).opacity = fl;
      (winGlow.material as THREE.SpriteMaterial).opacity = 0.9 + 0.1 * Math.sin(t * 1.3); winL.intensity = 5;
      flicker(porch, t);
      // tube man: a travelling wave up the body, flailing arms
      segs.forEach((s, i) => { s.rotation.z = (i ? 0.22 : 0.08) * Math.sin(t * 3.2 - i * 0.9) + (i === 3 ? 0.1 * Math.sin(t * 1.3) : 0); s.rotation.x = 0.08 * Math.sin(t * 2.1 - i * 0.7); });
      arms.forEach((a, s) => a.forEach((g, k) => { if (k) g.rotation.z = 0.5 * Math.sin(t * 4.5 - k * 1.1 + s * 1.7); else g.rotation.z = (s ? -1 : 1) * (1.0 + 0.5 * Math.sin(t * 3.0 + s)); }));
      flags.forEach((f) => { const p = f.m.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) { const x = f.base[i * 3], y = f.base[i * 3 + 1]; p.setZ(i, (x / 0.62) * 0.12 * Math.sin(t * 5 - x * 6 + y * 0.8 + f.ph)); } p.needsUpdate = true; });
      balloons.forEach((bg, i) => { bg.rotation.z = 0.12 * Math.sin(t * 1.4 + i); bg.rotation.x = 0.1 * Math.sin(t * 1.1 + i * 2); });
      passers.forEach((g) => { const u = ((t * 9 + g.userData.ph) % 120) - 60; g.position.x = g.userData.dirn * u; });
      (mastLight.material as THREE.SpriteMaterial).opacity = Math.sin(t * 2.5) > 0 ? 1 : 0.15;
      // scratch sparkle
      const sg = cl01(c.scratchGlow ?? 0);
      sparkle(scrSp, t * 1.6, sg * 1.2); (scrGlow.material as THREE.SpriteMaterial).opacity = sg * (0.7 + 0.3 * Math.sin(t * 6)); scrGlow.scale.setScalar(0.35 + 0.4 * sg);
      (scratch.material as THREE.MeshBasicMaterial).color.setScalar(1 + 1.2 * sg);
      // rear bumper gag: sag -> drop -> bounce
      const bu = cl01(c.bumper ?? 0), bp = hero.bumperR, y0 = 0.32, z0 = -(hero.W + 0.02) / 2, x0 = -hero.L / 2 - 0.06;
      if (bu < 0.45) { const k = bu / 0.45; bp.position.set(x0, y0, z0); bp.rotation.set(0.24 * k * k * (3 - 2 * k) + 0.03 * Math.sin(t * 9) * k, 0, 0); }
      else if (bu < 0.75) { const k = (bu - 0.45) / 0.3, e = k * k; bp.position.set(x0 - 0.15 * k, y0 - (y0 - 0.085) * e, z0 + 0.0); bp.rotation.set(0.24 * (1 - e), 0.15 * k, 0.1 * k); }
      else { const k = (bu - 0.75) / 0.25, hop = Math.abs(Math.sin(k * Math.PI * 2)) * 0.06 * (1 - k); bp.position.set(x0 - 0.15, 0.085 + hop, z0); bp.rotation.set(0.04 * (1 - k), 0.15, 0.1 * (1 - k)); }
    },
  };
};

