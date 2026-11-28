// Paris, 1925: a wide cobbled boulevard between cream Haussmann blocks (ground-floor shops with awnings, two
// continuous wrought-iron balconies, blue-grey slate mansards with dormers and smoking chimney pots), plane trees,
// candelabra lamp posts, a Morris column, the green newsstand kiosk ("LA TOUR ROUILLE!"), the CAFÉ DU BOULON terrace,
// a small police station (left, near end) and the Eiffel Tower standing at the far end of the axis.
//
// LAYOUT (set-local metres). The boulevard runs along z; looking down -z you look at the tower.
//   carriageway x -8.5..8.5 (cobbles, y = 0); sidewalks x +-8.75..16 raised to y = SW = 0.14 (granite curbs);
//   facades at x = +-16 (blocks 12 m deep); near blocks z 131..-124 (a domed building closes the +z vista at z 165), a cross avenue z -124..-156 (distant tram),
//   far blocks z -156..-246, then the Champ de Mars (trees) and the TOWER at [0, 0, -420] (scale 0.5: 156 m tall).
//   Café du Boulon: right side, facade z -6..9, terrace x 10.4..16 (awning x 12.6..16, y >= 2.6).
//   Newsstand kiosk: left sidewalk [-12.2, SW, -3]. Morris column [-10.6, SW, -18].
//   Police station: left side, facade z 26..41, steps x -16..-13.4 / z 31.4..35.6 up to y = SW + 0.68.
// CAR (ctl): the limousine drives along the lane x = 4.0 toward -z (toward the tower):
//   c.car 0..1 -> z = 72 - 190 * car (72 -> -118), wheels turn, body bobs. Export streetCarZ(u) and streetTrack(u)
//   (camera pos/look pair alongside the car in the left lane, x 0.4) for the shot code.
//   c.carStop 0..1 (overrides car when > 0): pulls in from the lane at z 30 and parks at the café curb [7.3, 0, -3.5]
//   (ease-out, 1 = parked, idling). Keep-clear lanes: the whole carriageway x -8.3..8.3 is empty (camera + car).
//   c.carColour is not a ctl; parked extras: a black and a green limousine far down the left curb (z -40, -70).
// OTHER CTL: c.lamps 0..1 (lamp posts, lit windows, police blue lamp, headlamps). Default = automatic: on when the
//   light preset is dusk/night (police), off in day (paris).
// AMBIENT: awning hems flutter, chimney smoke, ground pigeons hop + peck, a pigeon flock circles, plane leaves fall,
//   the café blade sign + door plaque swing, hanging newspapers flutter, the tricolour flag waves, a tram crosses the
//   far avenue (x -90..90 at z -140), lamp flicker at dusk.
// MARKS: see `marks` below (feet positions, sidewalk y = SW). CAMS: crane, cafe, kiosk, track, police, boulevard.
// KEEP-OUT (camera must never enter): STREET_SOLIDS (blocks, kiosk, column, trees, lamps, café terrace, police steps,
//   gendarme box, tower). The carriageway above y 0 is free up to the tree canopies (x +-6.8 at y > 5.2).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { ctex, rng, stoneHD, cobbleHD, roofHD, beamHD } from "../paint";
import { glow, mist } from "../setkit";
import { cl, lerp, TAU, stripeTex, weaveTex, fitText } from "./portkit_common";
import { leafTex, birds } from "./innerkit_b";
import { twoTone, TONE } from "../shade";
import { NOINK } from "../ink";
import { limo, type Limo } from "./limo";
import type { SetDef, V3 } from "./types";
export { limo } from "./limo";

// ---------------- layout constants ----------------
const SW = 0.14, FX = 16, CURB = 8.5, H0 = 4.6, FL = 3.2, CORN = H0 + 5 * FL; // cornice at 20.6
const WIN_W = 1.25, WIN_H = 2.35, SILL = 0.12;
const LANE = 4.0, CAR_Z0 = 72, CAR_Z1 = -118, TOWER: V3 = [0, 0, -420], TOWER_S = 0.5;
export const streetCarZ = (u: number) => CAR_Z0 + (CAR_Z1 - CAR_Z0) * u;
/** tracking framing alongside the moving car (left lane): pass the same u as c.car */
export const streetTrack = (u: number, mode: "side" | "front" = "side"): { pos: V3; look: V3; fov: number } => {
  const z = streetCarZ(u);
  return mode === "side" ? { pos: [-2.6, 1.55, z + 4.2], look: [LANE, 1.15, z - 0.2], fov: 38 } : { pos: [0.2, 1.7, z - 11], look: [LANE - 0.1, 1.05, z - 0.8], fov: 36 };
};
const PARK: V3 = [7.3, 0, -3.5];
const TREES_R = [118, 106, 94, 82, 70, 56, 44, 30, 17, -10, -26, -38, -50, -62, -74, -86, -98, -110, -166, -186, -206, -226];
const TREES_L = [118, 106, 94, 82, 70, 58, 46, 21, 8, -14, -28, -42, -54, -66, -78, -90, -102, -114, -166, -186, -206, -226];
const LAMPS_R: number[] = [124, 100, 76, 63, 37, 12, -18, -32, -44, -68, -92, -116];
const LAMPS_L: number[] = [124, 100, 76, 64, 38, 14, -7, -24, -36, -60, -84, -108];
const KIOSK: V3 = [-12.2, SW, -3.0], MORRIS: V3 = [-10.6, SW, -18];
const box3 = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): [V3, V3] => [[x0, y0, z0], [x1, y1, z1]];
export const STREET_SOLIDS: [V3, V3][] = [
  box3(16, -1, -124, 29, 27, 132), box3(-29, -1, -124, -16, 27, 132), box3(-46, -1, 164, 46, 50, 190), box3(16, -1, -247, 29, 27, -156), box3(-29, -1, -247, -16, 27, -156),
  box3(-13.6, 0, -4.4, -10.8, 4.4, -1.6), box3(-11.4, 0, -18.8, -9.8, 4.8, -17.2),
  box3(10.3, 0, -6.2, 16, 1.1, 9.6), box3(12.4, 2.5, -6.2, 16, 3.6, 9.6),       // café terrace (tables) + awning
  box3(-16, 0, 31.2, -13.2, 1.0, 35.8), box3(-15.7, 0, 28.7, -14.3, 2.8, 30.1),  // police steps, gendarme box
  box3(-35, 0, -455, 35, 160, -385),                                             // the tower
  ...TREES_R.map((z) => box3(9.0, 0, z - 0.5, 10.2, 5.4, z + 0.5)), ...TREES_L.map((z) => box3(-10.2, 0, z - 0.5, -9.0, 5.4, z + 0.5)),
  ...TREES_R.map((z) => box3(6.8, 5.2, z - 3.2, 13.4, 11, z + 3.2)), ...TREES_L.map((z) => box3(-13.4, 5.2, z - 3.2, -6.8, 11, z + 3.2)),
  ...LAMPS_R.map((z) => box3(8.6, 0, z - 0.4, 9.4, 4.8, z + 0.4)), ...LAMPS_L.map((z) => box3(-9.4, 0, z - 0.4, -8.6, 4.8, z + 0.4)),
];

// ---------------- materials ----------------
const cache = new Map<string, THREE.Material>();
const mat = <T extends THREE.Material>(key: string, make: () => T): T => { let m = cache.get(key) as T | undefined; if (!m) { m = make(); cache.set(key, m); } return m; };
const cut = (key: string, tex: () => THREE.Texture) => mat("cut_" + key, () => twoTone(new THREE.MeshLambertMaterial({ map: tex(), alphaTest: 0.5, side: THREE.DoubleSide })));
const ds = (key: string, tex: () => THREE.Texture) => mat("ds_" + key, () => twoTone(new THREE.MeshLambertMaterial({ map: tex(), side: THREE.DoubleSide })));
const col = (c: string) => lam("pcol" + c, () => ({ color: c }));
const shiny = (key: string, color: string, sh = 60) => mat("sh_" + key, () => twoTone(new THREE.MeshPhongMaterial({ color, specular: "#ffffff", shininess: sh })));
const signMats: THREE.MeshBasicMaterial[] = [];
const unlit = (key: string, tex: () => THREE.Texture, transparent = false) => mat("ul_" + key, () => { const m = new THREE.MeshBasicMaterial({ map: tex(), transparent, alphaTest: transparent ? 0.4 : 0 }); signMats.push(m); return m; });
const lighten = (hex: string, k: number) => "#" + new THREE.Color(hex).lerp(new THREE.Color("#fffaf0"), k).getHexString();
const darken = (hex: string, k: number) => "#" + new THREE.Color(hex).lerp(new THREE.Color("#2a2030"), k).getHexString();
const blot = (g: CanvasRenderingContext2D, x: number, y: number, rad: number, rgba: string) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
const scaleUV = (geo: THREE.BufferGeometry, su: number, sv: number) => { const uv = geo.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
const rodGeo = (a: V3, c: V3, r: number, seg = 6) => {
  const A = V(...a), C = V(...c), geo = new THREE.CylinderGeometry(r, r, A.distanceTo(C), seg);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), C.clone().sub(A).normalize())); return geo.translate((A.x + C.x) / 2, (A.y + C.y) / 2, (A.z + C.z) / 2);
};
const SERIF = "900 %spx Georgia, 'Times New Roman', serif", DIDOT = "700 %spx Georgia, serif";
/** text panel texture: bg, centred text that always fits (master prompt: text inside its sign) */
const textTex = (key: string, text: string, w: number, h: number, bg: string | null, fg: string, o: { font?: string; size?: number; border?: string; outline?: string } = {}) => ctex("ptxt|" + key, w, h, (g) => {
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,0.10)"); gr.addColorStop(1, "rgba(0,0,0,0.14)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  if (o.border) { g.strokeStyle = o.border; g.lineWidth = Math.max(3, h * 0.05); g.strokeRect(h * 0.08, h * 0.08, w - h * 0.16, h - h * 0.16); }
  g.textAlign = "center"; g.textBaseline = "middle";
  const lines = text.split("\n"), size = (o.size ?? 0.62) * h / lines.length;
  lines.forEach((l, i) => {
    const y = h / 2 + (i - (lines.length - 1) / 2) * size * 1.12 + size * 0.06;
    if (o.outline) { g.save(); g.fillStyle = o.outline; fitText(g, l, w / 2 + size * 0.04, y + size * 0.05, w * 0.86, size, o.font ?? SERIF); g.restore(); }
    g.fillStyle = fg; fitText(g, l, w / 2, y, w * 0.86, size, o.font ?? SERIF);
  });
});

// ---------------- painted textures ----------------
const PX = 128; // texels per metre on facades
/** one window bay of a stone facade (bottom floor first), opening = the glass quad, painted surrounds + hoods */
const frontTex = (key: string, wall: string, floors: number[], winW: number, winH: number, sill: number, hoods: string[], bayW = 3) =>
  ctex("front|" + key, Math.round(bayW * PX), Math.round(floors.reduce((a, b) => a + b, 0) * PX), (g, r) => {
    const w = g.canvas.width, h = g.canvas.height, lt = lighten(wall, 0.5), dk = "rgba(112,86,62,0.38)";
    g.fillStyle = wall; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 10; i++) blot(g, r() * w, r() * h, 60 + r() * 150, r() < 0.6 ? "rgba(150,118,84,0.08)" : "rgba(255,250,235,0.12)");
    const CH = 0.42 * PX;
    for (let y = h; y > 0; y -= CH) {
      g.fillStyle = "rgba(128,100,74,0.2)"; g.fillRect(0, y - 2, w, 2); g.fillStyle = "rgba(255,250,238,0.3)"; g.fillRect(0, y, w, 1.5);
      for (let x = r() * 70; x < w; x += 80 + r() * 70) { g.fillStyle = "rgba(128,100,74,0.13)"; g.fillRect(x, y - CH, 1.5, CH); }
    }
    let yb = h;
    floors.forEach((fh, k) => {
      const ww = winW * PX, wh = winH * PX, wx = (w - ww) / 2, wy = yb - sill * PX - wh, S = 15;
      g.fillStyle = lt; g.fillRect(0, yb - 15, w, 10); g.fillStyle = "rgba(110,84,60,0.32)"; g.fillRect(0, yb - 5, w, 5);
      g.fillStyle = lt; g.fillRect(wx - S, wy - S, ww + 2 * S, wh + S); g.fillRect(wx - S - 9, wy - S, 9, 26); g.fillRect(wx + ww + S, wy - S, 9, 26);
      g.fillStyle = dk; g.fillRect(wx + ww + S - 3, wy - S, 3, wh + S); g.fillRect(wx - S, wy - S, ww + 2 * S, 2);
      const hd = hoods[k] ?? "flat", top = wy - S;
      g.fillStyle = lt;
      if (hd === "ped") { g.beginPath(); g.moveTo(wx - S - 16, top - 4); g.lineTo(w / 2, top - 50); g.lineTo(wx + ww + S + 16, top - 4); g.closePath(); g.fill(); g.strokeStyle = dk; g.lineWidth = 3; g.stroke(); g.fillStyle = "rgba(112,86,62,0.15)"; g.beginPath(); g.moveTo(wx, top - 10); g.lineTo(w / 2, top - 38); g.lineTo(wx + ww, top - 10); g.closePath(); g.fill(); }
      else if (hd === "seg") { g.beginPath(); g.moveTo(wx - S - 12, top); g.quadraticCurveTo(w / 2, top - 58, wx + ww + S + 12, top); g.lineTo(wx + ww + S + 12, top - 12); g.quadraticCurveTo(w / 2, top - 72, wx - S - 12, top - 12); g.closePath(); g.fill(); g.strokeStyle = dk; g.lineWidth = 2; g.stroke(); }
      else if (hd === "flat") { g.fillRect(wx - S - 14, top - 18, ww + 2 * S + 28, 14); g.fillStyle = dk; g.fillRect(wx - S - 14, top - 5, ww + 2 * S + 28, 3); g.fillStyle = lt; for (const x of [wx - S - 10, wx + ww + S + 2]) g.fillRect(x, top - 4, 8, 20); }
      if (hd !== "none") { g.fillStyle = lighten(wall, 0.65); g.beginPath(); g.moveTo(w / 2 - 14, top - 6); g.lineTo(w / 2 + 14, top - 6); g.lineTo(w / 2 + 9, wy + 10); g.lineTo(w / 2 - 9, wy + 10); g.closePath(); g.fill(); g.strokeStyle = dk; g.lineWidth = 2; g.stroke(); }
      g.fillStyle = "#2b3040"; g.fillRect(wx, wy, ww, wh);
      g.fillStyle = lt; g.fillRect(wx - S - 6, wy + wh, ww + 2 * S + 12, 9); g.fillStyle = dk; g.fillRect(wx - S - 6, wy + wh + 9, ww + 2 * S + 12, 3);
      const st = g.createLinearGradient(0, wy + wh + 12, 0, wy + wh + 90); st.addColorStop(0, "rgba(120,98,76,0.16)"); st.addColorStop(1, "rgba(120,98,76,0)"); g.fillStyle = st; g.fillRect(wx + 6, wy + wh + 12, ww - 12, 78);
      yb -= fh * PX;
    });
    g.fillStyle = lighten(wall, 0.35); g.fillRect(0, 0, w, 30); for (let x = 4; x < w; x += 18) { g.fillStyle = "rgba(110,84,60,0.4)"; g.fillRect(x + 11, 9, 6, 21); }
  });
/** rusticated ground-floor stone: deep horizontal channels (bay 3 m x 4.6 m) */
const rusticTex = (key: string, wall: string, hgt = H0) => ctex("rustic|" + key, 384, Math.round(hgt * PX), (g, r) => {
  const w = 384, h = g.canvas.height; g.fillStyle = lighten(wall, 0.12); g.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) blot(g, r() * w, r() * h, 50 + r() * 100, r() < 0.7 ? "rgba(140,110,80,0.09)" : "rgba(255,250,235,0.12)");
  for (let y = h; y > 0; y -= 0.46 * PX) { g.fillStyle = "rgba(96,74,56,0.45)"; g.fillRect(0, y - 7, w, 5); g.fillStyle = "rgba(255,250,236,0.45)"; g.fillRect(0, y - 2, w, 2); }
  const dirt = g.createLinearGradient(0, h - 70, 0, h); dirt.addColorStop(0, "rgba(110,90,70,0)"); dirt.addColorStop(1, "rgba(110,90,70,0.25)"); g.fillStyle = dirt; g.fillRect(0, h - 70, w, 70);
});
/** French-window glass atlas: 4 variants (plain, lace, drapes, persiennes); lit = warm night version */
const glassAtlas = (lit: boolean) => ctex(lit ? "pGlassLit" : "pGlassDay", 512, 256, (g) => {
  for (let v = 0; v < 4; v++) {
    const x0 = v * 128, gr = g.createLinearGradient(0, 0, 0, 256);
    if (lit) { gr.addColorStop(0, "#ffe6a8"); gr.addColorStop(1, "#f2a85a"); } else { gr.addColorStop(0, "#90a8cc"); gr.addColorStop(0.45, "#55688f"); gr.addColorStop(1, "#30395a"); }
    g.fillStyle = gr; g.fillRect(x0, 0, 128, 256);
    if (!lit) { g.fillStyle = "rgba(255,255,255,0.2)"; g.beginPath(); g.moveTo(x0 + 20, 0); g.lineTo(x0 + 70, 0); g.lineTo(x0 + 10, 256); g.lineTo(x0 - 40, 256); g.fill(); }
    if (v === 1) { g.fillStyle = lit ? "rgba(255,246,220,0.85)" : "#ece6da"; g.fillRect(x0, 150, 128, 106); g.fillStyle = lit ? "rgba(240,170,90,0.6)" : "rgba(150,140,130,0.45)"; for (let x = 6; x < 128; x += 14) { g.beginPath(); g.arc(x0 + x, 150, 6, 0, Math.PI); g.fill(); } for (let y = 170; y < 256; y += 16) for (let x = 8; x < 128; x += 16) { g.beginPath(); g.arc(x0 + x, y, 2.5, 0, TAU); g.fill(); } }
    if (v === 2) for (const [a, b] of [[0, 34], [94, 128]]) { g.fillStyle = lit ? "#d0703a" : "#9c3238"; g.fillRect(x0 + a, 0, b - a, 256); g.fillStyle = "rgba(40,10,20,0.3)"; for (let x = a + 5; x < b; x += 9) g.fillRect(x0 + x, 0, 3, 256); }
    if (v === 3) for (const [a, b] of [[8, 60], [68, 120]]) { g.fillStyle = lit ? "#a8784a" : "#8a94a4"; g.fillRect(x0 + a, 10, b - a, 120); g.fillStyle = "rgba(30,30,50,0.35)"; for (let y = 14; y < 130; y += 8) g.fillRect(x0 + a, y, b - a, 3); }
    const fr = lit ? "#4a3428" : "#f1ece2";
    g.fillStyle = fr; g.fillRect(x0, 0, 128, 8); g.fillRect(x0, 248, 128, 8); g.fillRect(x0, 0, 8, 256); g.fillRect(x0 + 120, 0, 8, 256); g.fillRect(x0 + 60, 0, 8, 256);
    for (const y of [82, 164]) { g.fillRect(x0 + 8, y, 112, 5); }
    g.fillStyle = "rgba(30,30,50,0.25)"; g.fillRect(x0 + 8, 8, 112, 3); g.fillRect(x0 + 68, 8, 3, 240);
  }
});
const railTex = () => ctex("pRail", 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256); g.fillStyle = g.strokeStyle = "#26222c";
  g.fillRect(0, 0, 256, 15); g.fillRect(0, 238, 256, 12); g.fillRect(0, 58, 256, 6); g.fillRect(0, 202, 256, 6);
  for (let x = 0; x < 256; x += 32) g.fillRect(x + 14, 15, 5, 225);
  g.lineWidth = 5;
  for (let x = 0; x < 256; x += 64) {
    g.beginPath(); g.arc(x + 32, 133, 24, 0, TAU); g.stroke(); g.beginPath(); g.arc(x + 32, 133, 9, 0, TAU); g.stroke();
    g.beginPath(); g.arc(x + 8, 88, 14, -Math.PI / 2, Math.PI); g.stroke(); g.beginPath(); g.arc(x + 56, 178, 14, Math.PI / 2, TAU); g.stroke();
  }
});
const goodsTex = (kind: string) => ctex("pGoods|" + kind, 512, 384, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 384); gr.addColorStop(0, "#4a3426"); gr.addColorStop(1, "#2a1c16"); g.fillStyle = gr; g.fillRect(0, 0, 512, 384);
  blot(g, 256, 120, 260, "rgba(255,210,140,0.35)");
  g.fillStyle = "#6a4a30"; for (const y of [130, 250]) g.fillRect(0, y, 512, 12); g.fillStyle = "#8a6440"; g.fillRect(0, 330, 512, 54);
  const P = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  for (const sy of [128, 248, 330]) for (let x = 14; x < 500; x += 0) {
    if (kind === "bread") { const lw = 70 + r() * 50; if (r() < 0.5) { g.fillStyle = P(["#d89a4a", "#c98436", "#e6b066"]); g.beginPath(); g.ellipse(x + lw / 2, sy - 14, lw / 2, 13, -0.1, 0, TAU); g.fill(); g.strokeStyle = "#f2d29a"; g.lineWidth = 3; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x + k * lw / 4 - 8, sy - 20); g.lineTo(x + k * lw / 4 + 6, sy - 8); g.stroke(); } } else { g.fillStyle = P(["#c27a3a", "#d6974e"]); g.beginPath(); g.ellipse(x + 30, sy - 24, 30, 24, 0, Math.PI, TAU); g.fill(); g.fillRect(x, sy - 24, 60, 22); } x += lw + 10; }
    else if (kind === "hats") { const c = P(["#2a2a36", "#7a3a2a", "#3a5a7a", "#c9a46a", "#8a2a4a", "#2f5a3a"]); g.fillStyle = "#3a2a20"; g.fillRect(x + 36, sy - 70, 6, 70); g.fillStyle = c; g.beginPath(); g.ellipse(x + 39, sy - 66, 40, 9, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(x + 39, sy - 82, 25, 22, 0, Math.PI, TAU); g.fill(); g.fillRect(x + 14, sy - 82, 50, 16); g.fillStyle = P(["#e8d8b0", "#c8352e", "#1e1e28"]); g.fillRect(x + 14, sy - 76, 50, 6); x += 92; }
    else if (kind === "flowers") { g.fillStyle = "#5a6a7a"; g.fillRect(x + 6, sy - 40, 56, 40); for (let k = 0; k < 9; k++) { g.fillStyle = "#3f7a3a"; g.beginPath(); g.arc(x + 12 + r() * 44, sy - 46 - r() * 30, 9, 0, TAU); g.fill(); } for (let k = 0; k < 9; k++) { g.fillStyle = P(["#e84a6a", "#f2c23a", "#f6f0f0", "#b84ad0", "#ff8a3a"]); g.beginPath(); g.arc(x + 12 + r() * 44, sy - 52 - r() * 36, 8, 0, TAU); g.fill(); } x += 74; }
    else if (kind === "books") { const bw = 14 + r() * 16, bh = 70 + r() * 40; g.fillStyle = P(["#8a2a2a", "#2a4a7a", "#3a6a3a", "#c9a24a", "#5a3a6a", "#e8dcc0"]); g.fillRect(x, sy - bh, bw, bh); g.fillStyle = "rgba(255,230,160,0.7)"; g.fillRect(x + 2, sy - bh + 12, bw - 4, 4); g.fillRect(x + 2, sy - 22, bw - 4, 3); x += bw + 2; }
    else if (kind === "bottles") { const c = P(["#2f6a3a", "#7a4a1a", "#3a2a1a", "#a8c8a0", "#8a1a2a"]); g.fillStyle = c; g.fillRect(x + 4, sy - 70, 26, 70); g.beginPath(); g.ellipse(x + 17, sy - 70, 13, 10, 0, Math.PI, TAU); g.fill(); g.fillRect(x + 12, sy - 100, 10, 26); g.fillStyle = "#f2e6c8"; g.fillRect(x + 6, sy - 46, 22, 22); g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(x + 8, sy - 66, 4, 40); x += 38; }
    else { g.fillStyle = P(["#c9a24a", "#8a5a2a", "#e8dcc0"]); g.beginPath(); g.arc(x + 34, sy - 40, 30, 0, TAU); g.fill(); g.fillStyle = "#f8f2e2"; g.beginPath(); g.arc(x + 34, sy - 40, 23, 0, TAU); g.fill(); g.strokeStyle = "#2a2020"; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 34, sy - 40); g.lineTo(x + 34, sy - 58); g.moveTo(x + 34, sy - 40); g.lineTo(x + 46, sy - 34); g.stroke(); x += 78; }
  }
  g.fillStyle = "rgba(255,255,255,0.16)"; g.beginPath(); g.moveTo(60, 0); g.lineTo(170, 0); g.lineTo(80, 384); g.lineTo(-30, 384); g.fill();
  g.fillStyle = "rgba(255,255,255,0.08)"; g.beginPath(); g.moveTo(330, 0); g.lineTo(370, 0); g.lineTo(280, 384); g.lineTo(240, 384); g.fill();
});
const doorTex = (c: string, glassy = true) => ctex("pDoor|" + c + glassy, 256, 512, (g) => {
  g.fillStyle = c; g.fillRect(0, 0, 256, 512); g.fillStyle = darken(c, 0.35);
  if (glassy) { const gr = g.createLinearGradient(0, 0, 0, 300); gr.addColorStop(0, "#7d8fb0"); gr.addColorStop(1, "#2e3650"); g.fillStyle = gr; g.fillRect(34, 34, 188, 280); g.fillStyle = "rgba(255,255,255,0.2)"; g.beginPath(); g.moveTo(60, 34); g.lineTo(110, 34); g.lineTo(60, 314); g.lineTo(34, 314); g.fill(); g.fillStyle = c; g.fillRect(124, 34, 8, 280); }
  else { g.fillRect(34, 34, 80, 280); g.fillRect(142, 34, 80, 280); g.fillStyle = lighten(c, 0.15); g.fillRect(44, 44, 60, 260); g.fillRect(152, 44, 60, 260); }
  g.fillStyle = darken(c, 0.35); g.fillRect(34, 340, 188, 140); g.fillStyle = lighten(c, 0.12); g.fillRect(46, 352, 164, 116);
  g.fillStyle = "#e0b04a"; g.beginPath(); g.arc(200, 330, 9, 0, TAU); g.fill();
});
const barkTex = () => ctex("pPlaneBark", 256, 512, (g, r) => {
  g.fillStyle = "#b9b394"; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 60; i++) { g.fillStyle = ["#8f8c6c", "#d9d3b6", "#a6a284", "#c9c09a", "#7f7e64"][i % 5]; g.beginPath(); const x = r() * 256, y = r() * 512; g.ellipse(x, y, 14 + r() * 30, 18 + r() * 40, r() * 3, 0, TAU); g.fill(); }
});
const grateTex = () => ctex("pGrate", 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256); g.strokeStyle = "#2c2a30"; g.lineWidth = 7;
  for (const rr of [40, 75, 110, 124]) { g.beginPath(); g.arc(128, 128, rr, 0, TAU); g.stroke(); }
  for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; g.beginPath(); g.moveTo(128 + Math.cos(a) * 30, 128 + Math.sin(a) * 30); g.lineTo(128 + Math.cos(a) * 124, 128 + Math.sin(a) * 124); g.stroke(); }
  g.fillStyle = "#7a6650"; g.beginPath(); g.arc(128, 128, 28, 0, TAU); g.fill();
});
const scallop = (c1: string, c2: string) => ctex(`pScallop|${c1}|${c2}`, 512, 64, (g) => {
  const n = 8, w = 512 / n;
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? c2 : c1; g.beginPath(); g.moveTo(i * w, 0); g.lineTo(i * w + w, 0); g.lineTo(i * w + w, 30); g.arc(i * w + w / 2, 30, w / 2, 0, Math.PI); g.closePath(); g.fill(); g.strokeStyle = "rgba(60,25,25,0.5)"; g.lineWidth = 2; g.stroke(); }
});
const latticeTex = () => ctex("pTowerLattice", 256, 256, (g) => {
  g.fillStyle = "#a27a66"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#7c5a50"; for (let y = 0; y < 256; y += 32) for (let x = 0; x < 256; x += 32) g.fillRect(x + 5, y + 5, 22, 22);
  g.strokeStyle = "#dcb296"; g.lineWidth = 5; for (let k = -256; k < 512; k += 64) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 256, 256); g.stroke(); g.beginPath(); g.moveTo(k + 256, 0); g.lineTo(k, 256); g.stroke(); }
  g.fillStyle = "#d6ae96"; g.fillRect(0, 0, 10, 256); g.fillRect(246, 0, 10, 256); g.fillRect(0, 0, 256, 6); g.fillRect(0, 126, 256, 6);
});
const posterTex = () => ctex("pMorrisPosters", 1024, 512, (g, r) => {
  g.fillStyle = "#e9dcc0"; g.fillRect(0, 0, 1024, 512);
  const P: [string, string, string, string][] = [["#c8352e", "#f6e2a8", "CIRQUE\nLUNA", "moon"], ["#22324f", "#f2c65a", "BAL DES\nLILAS", "dance"], ["#f2c230", "#2a1a10", "MADAME\nFIFI", "star"], ["#2f6a4a", "#f6efe0", "CINÉMA\nDU PARC", "film"], ["#7a2a5a", "#f8e8c0", "LE PETIT\nCABARET", "dance"]];
  P.forEach(([bg, fg, title, ic], i) => {
    const x = i * 204 + 6, w = 192; g.fillStyle = bg; g.fillRect(x, 20, w, 470);
    g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle"; title.split("\n").forEach((l, k) => fitText(g, l, x + w / 2, 70 + k * 48, w * 0.86, 44, SERIF));
    g.fillStyle = fg;
    if (ic === "moon") { g.beginPath(); g.arc(x + w / 2, 260, 60, 0, TAU); g.fill(); g.fillStyle = bg; g.beginPath(); g.arc(x + w / 2 + 26, 248, 52, 0, TAU); g.fill(); }
    else if (ic === "dance") { g.beginPath(); g.arc(x + w / 2, 200, 22, 0, TAU); g.fill(); g.beginPath(); g.moveTo(x + w / 2, 222); g.lineTo(x + w / 2 - 60, 340); g.lineTo(x + w / 2 + 60, 340); g.fill(); g.fillRect(x + w / 2 - 30, 330, 8, 60); g.fillRect(x + w / 2 + 22, 330, 8, 60); }
    else if (ic === "star") { g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? 30 : 75; g.lineTo(x + w / 2 + Math.cos(a) * rr, 270 + Math.sin(a) * rr); } g.fill(); }
    else { g.fillRect(x + 40, 200, w - 80, 130); g.fillStyle = bg; for (let k = 0; k < 5; k++) g.fillRect(x + 50 + k * 22, 210, 12, 12); g.fillRect(x + 56, 240, w - 112, 76); }
    g.fillStyle = fg; g.fillRect(x + 20, 400, w - 40, 6); g.font = "700 22px Georgia"; g.fillText("CE SOIR", x + w / 2, 440);
  });
  for (let i = 0; i < 30; i++) blot(g, r() * 1024, r() * 512, 30 + r() * 60, "rgba(240,230,200,0.15)");
});
const paperTex = (name: string, head: string, tint = "#f2ead6") => ctex("pPaper|" + name, 160, 220, (g, r) => {
  g.fillStyle = tint; g.fillRect(0, 0, 160, 220);
  g.fillStyle = "#1e1a20"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, name, 80, 22, 148, 22, SERIF); g.fillRect(8, 38, 144, 3);
  g.fillStyle = "#b8261e"; fitText(g, head, 80, 60, 148, 24, SERIF);
  g.fillStyle = "#7a7480"; g.fillRect(10, 82, 66, 56);
  g.fillStyle = "rgba(30,26,32,0.55)"; for (let y = 86; y < 214; y += 8) { g.fillRect(84, y, 64 * (0.6 + r() * 0.4), 3); if (y > 146) g.fillRect(10, y, 66 * (0.6 + r() * 0.4), 3); }
});
const cafeTex = () => ctex("pCafeWin", 512, 448, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 448); gr.addColorStop(0, "#6a3a24"); gr.addColorStop(1, "#3a1e14"); g.fillStyle = gr; g.fillRect(0, 0, 512, 448);
  g.fillStyle = "#c9a24a"; g.fillRect(40, 40, 432, 170); g.fillStyle = "#9fb4c8"; g.fillRect(52, 52, 408, 146); g.fillStyle = "rgba(255,255,255,0.3)"; g.fillRect(70, 52, 30, 146);
  for (let x = 70; x < 450; x += 22) { g.fillStyle = ["#2f6a3a", "#7a4a1a", "#8a1a2a", "#c9b46a"][Math.floor(r() * 4)]; g.fillRect(x, 160, 14, 38); g.fillRect(x + 4, 146, 6, 16); }
  for (const x of [110, 256, 402]) { blot(g, x, 96, 70, "rgba(255,220,150,0.9)"); g.fillStyle = "#fff4d0"; g.beginPath(); g.arc(x, 96, 18, 0, TAU); g.fill(); }
  g.fillStyle = "#b8bcc4"; g.fillRect(0, 262, 512, 20); g.fillStyle = "#5a2e1e"; g.fillRect(0, 282, 512, 166);
  g.fillStyle = "#f3eee4"; g.fillRect(0, 290, 512, 158); g.fillStyle = "rgba(160,140,120,0.45)"; for (let x = 8; x < 512; x += 16) { g.beginPath(); g.arc(x, 290, 7, 0, Math.PI); g.fill(); } for (let y = 312; y < 448; y += 18) for (let x = 10; x < 512; x += 18) { g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); }
  g.fillStyle = "#c9a24a"; g.fillRect(0, 286, 512, 6);
  g.fillStyle = "#f2c65a"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "VINS · BIÈRES · CAFÉ", 256, 238, 380, 30, SERIF);
  g.fillStyle = "rgba(255,255,255,0.14)"; g.beginPath(); g.moveTo(330, 0); g.lineTo(420, 0); g.lineTo(300, 448); g.lineTo(210, 448); g.fill();
});
const chalkTex = () => ctex("pChalk", 256, 320, (g) => {
  g.fillStyle = "#26302c"; g.fillRect(0, 0, 256, 320); g.strokeStyle = "#8a6a44"; g.lineWidth = 12; g.strokeRect(6, 6, 244, 308);
  g.fillStyle = "#f4f0e6"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "MENU", 128, 46, 200, 40, "700 %spx Georgia");
  g.font = "italic 22px Georgia"; ["Café crème", "Croque-monsieur", "Vin rouge", "Tarte du jour"].forEach((l, i) => g.fillText(l, 128, 104 + i * 46));
  g.strokeStyle = "rgba(244,240,230,0.6)"; g.lineWidth = 2; g.beginPath(); g.moveTo(50, 76); g.lineTo(206, 76); g.stroke();
});
const tricolour = (key: string, w = 256, h = 160) => ctex("pTri|" + key, w, h, (g) => { ["#24418a", "#f6f2ea", "#d0283a"].forEach((c, i) => { g.fillStyle = c; g.fillRect((i * w) / 3, 0, w / 3 + 1, h); }); });
const guériteTex = () => ctex("pGuerite", 256, 512, (g) => {
  g.fillStyle = "#f4f0e6"; g.fillRect(0, 0, 256, 512);
  for (let k = -6; k < 12; k++) { g.fillStyle = k % 2 ? "#24418a" : "#d0283a"; g.beginPath(); g.moveTo(0, k * 64); g.lineTo(256, k * 64 + 128); g.lineTo(256, k * 64 + 160); g.lineTo(0, k * 64 + 32); g.fill(); }
  g.fillStyle = "#2a2a34"; g.fillRect(0, 0, 256, 10); g.fillRect(0, 502, 256, 10);
});
const policeGlobe = () => ctex("pPoliceGlobe", 512, 128, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, "#7cb0ff"); gr.addColorStop(1, "#2a56b8"); g.fillStyle = gr; g.fillRect(0, 0, 512, 128);
  g.fillStyle = "#ffffff"; g.textAlign = "center"; g.textBaseline = "middle"; for (let k = 0; k < 2; k++) fitText(g, "POLICE", 128 + k * 256, 68, 200, 62, SERIF);
});
const clockTex = () => ctex("pClock", 256, 256, (g) => {
  g.fillStyle = "#f6f0e0"; g.beginPath(); g.arc(128, 128, 120, 0, TAU); g.fill(); g.strokeStyle = "#2a2430"; g.lineWidth = 10; g.stroke();
  g.fillStyle = "#2a2430"; for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; g.fillRect(128 + Math.cos(a) * 96 - 5, 128 + Math.sin(a) * 96 - 5, 10, 10); }
  g.lineWidth = 9; g.lineCap = "round"; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + 52, 128 - 30); g.moveTo(128, 128); g.lineTo(128 - 8, 128 - 88); g.stroke();
});
const leafCut = () => ctex("pLeafCut", 64, 64, (g) => {
  g.clearRect(0, 0, 64, 64); g.fillStyle = "#86b24a"; g.beginPath();
  for (let k = 0; k <= 10; k++) { const a = -Math.PI / 2 + (k / 10) * TAU, rr = k % 2 ? 14 : 28; g.lineTo(32 + Math.cos(a) * rr, 34 + Math.sin(a) * rr); } g.fill();
  g.strokeStyle = "#5a8a2a"; g.lineWidth = 2; g.beginPath(); g.moveTo(32, 60); g.lineTo(32, 10); g.stroke();
});
const tramTex = () => ctex("pTram", 512, 128, (g) => {
  g.fillStyle = "#2f6a4a"; g.fillRect(0, 0, 512, 128); g.fillStyle = "#efe4c8"; g.fillRect(0, 0, 512, 64);
  for (let x = 16; x < 500; x += 54) { g.fillStyle = "#3a4560"; g.fillRect(x, 10, 40, 44); g.fillStyle = "rgba(255,255,255,0.25)"; g.fillRect(x + 4, 10, 8, 44); }
  g.fillStyle = "#c9a24a"; g.fillRect(0, 64, 512, 5); g.fillStyle = "#f2c65a"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "LIGNE 7", 256, 98, 200, 30, SERIF);
});
const ghostAd = () => ctex("pGhostAd", 1024, 768, (g, r) => {
  g.fillStyle = "#e7dac2"; g.fillRect(0, 0, 1024, 768);
  g.fillStyle = "rgba(170,56,48,0.62)"; g.fillRect(40, 60, 944, 230); g.fillStyle = "rgba(246,232,200,0.85)"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "QUINQUINA", 512, 178, 860, 170, SERIF);
  g.fillStyle = "rgba(40,50,90,0.6)"; fitText(g, "LEROY", 512, 420, 700, 190, SERIF);
  g.fillStyle = "rgba(40,50,90,0.45)"; fitText(g, "LE TONIQUE DES PARISIENS", 512, 600, 860, 70, SERIF);
  for (let i = 0; i < 70; i++) blot(g, r() * 1024, r() * 768, 30 + r() * 90, "rgba(231,218,194,0.5)");
});

// ---------------- building module (local frame: facade on z = 0 facing +z, x along the facade, y up from SW) ----------------
type Hem = { m: THREE.Mesh; amp: number; ph: number };
type Ctx = { b: Batch; glass: Batch; lit: Batch; rails: Batch; root: THREE.Group; hems: Hem[]; smoke: V3[]; r: () => number };
type Shop = { name: string; col: string; goods: string; awn?: [string, string] };
const SHOPS: Shop[] = [
  { name: "BOULANGERIE MOREAU", col: "#2f5d4a", goods: "bread", awn: ["#f3e3c3", "#2f6a50"] },
  { name: "CHAPELLERIE DUVAL", col: "#22324f", goods: "hats", awn: ["#f2e6cc", "#2b4a7a"] },
  { name: "FLEURS ROSALIE", col: "#6a2a3e", goods: "flowers", awn: ["#f4e2d0", "#b8405a"] },
  { name: "LIBRAIRIE DU PONT", col: "#4a2e22", goods: "books" },
  { name: "VINS FINS GAUTIER", col: "#5a1f22", goods: "bottles", awn: ["#efe0c4", "#8a2a2a"] },
  { name: "HORLOGERIE PETIT", col: "#1f3d3d", goods: "clocks" },
  { name: "ÉPICERIE FINE", col: "#6b4a1e", goods: "bottles", awn: ["#f2e4c6", "#c8892e"] },
  { name: "PÂTISSERIE LUCIE", col: "#b8707e", goods: "bread", awn: ["#fbeef0", "#d27a8a"] },
  { name: "MERCERIE BLANCHE", col: "#3a4a6a", goods: "hats" },
  { name: "PARFUMS DE NINON", col: "#2c2a4a", goods: "bottles", awn: ["#efe6f4", "#6a4a8a"] },
  { name: "PHARMACIE DU CENTRE", col: "#1e4a3a", goods: "bottles" },
  { name: "LIBRAIRIE VOLTAIRE", col: "#3a2a4a", goods: "books", awn: ["#f2e6cc", "#4a3a6a"] },
];
let shopI = 0;
const STY = [{ wall: "#efe1c6" }, { wall: "#f3e7d0" }, { wall: "#e8d6b8" }];
const styMats = (k: number) => {
  const wall = STY[k].wall;
  return {
    front: lam("pFront" + k, () => ({ map: frontTex("haus" + k, wall, [3.2, 3.2, 3.2, 3.2, 3.2], WIN_W, WIN_H, SILL, ["seg", "ped", "flat", "flat", "none"]) })),
    rustic: lam("pRustic" + k, () => ({ map: rusticTex("haus" + k, wall) })),
    plain: lam("pPlain" + k, () => ({ color: wall })), trim: lam("pTrim" + k, () => ({ color: lighten(wall, 0.4) })),
  };
};
const frameOf = (side: 1 | -1, zA: number, zB: number, x = FX) => {
  const W = Math.abs(zB - zA), th = side > 0 ? -Math.PI / 2 : Math.PI / 2, z0 = side > 0 ? Math.min(zA, zB) : Math.max(zA, zB);
  const MX = new THREE.Matrix4().makeRotationY(th).setPosition(side * x, SW, z0);
  return { W, th, z0, MX };
};
const loc = (MX: THREE.Matrix4, x: number, y: number, z: number): V3 => { const v = V(x, y, z).applyMatrix4(MX); return [v.x, v.y, v.z]; };
const groupAt = (root: THREE.Object3D, MX: THREE.Matrix4) => { const g = new THREE.Group(); g.matrixAutoUpdate = false; g.matrix.copy(MX); root.add(g); return g; };
const slate = () => lam("pSlate", () => ({ map: roofHD("#7d8aa3", true) })), zinc = () => lam("pZinc", () => ({ color: "#a9b2bf" }));
const railM = () => cut("rail", railTex);

/** a sloping striped awning with a fluttering scalloped hem (local to grp) */
const awning = (C: Ctx, grp: THREE.Object3D, x0: number, x1: number, y: number, c1: string, c2: string, depth = 1.7, drop = 0.75) => {
  const w = x1 - x0, g = new THREE.Group(); g.position.set((x0 + x1) / 2, y, 0.02); grp.add(g);
  const L = Math.hypot(depth, drop);
  const cloth = new THREE.Mesh(scaleUV(new THREE.PlaneGeometry(w, L, 1, 1), w / 3, 1).translate(0, -L / 2, 0).rotateX(-Math.atan2(depth, drop)), ds(`stripe${c1}${c2}`, () => stripeTex(c1, c2, 8)));
  cloth.castShadow = true; cloth.receiveShadow = true; g.add(cloth);
  const hem = new THREE.Mesh(scaleUV(new THREE.PlaneGeometry(w, 0.32, 16, 1), w / 3, 1).translate(0, -0.16, 0), cut(`scal${c1}${c2}`, () => scallop(c1, c2)));
  hem.position.set(0, -drop, depth); hem.castShadow = true; g.add(hem);
  const iron = col("#2a2830");
  for (const s of [-1, 1]) { const a = new THREE.Mesh(rodGeo([s * (w / 2 - 0.05), -drop + 0.02, depth - 0.02], [s * (w / 2 - 0.05), -drop - 0.55, 0], 0.018), iron); g.add(a); }
  C.hems.push({ m: hem, amp: 0.05 + 0.03 * C.r(), ph: C.r() * 6 });
};
const signPlate = (grp: THREE.Object3D, key: string, text: string, w: number, h: number, pos: V3, bg: string, fg: string, o: Parameters<typeof textTex>[6] = {}) => {
  const tw = 2048, th = Math.max(64, Math.round((tw * h) / w));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), unlit(key, () => textTex(key, text, tw, th, bg, fg, o)));
  m.position.set(...pos); grp.add(m); return m;
};
/** shopfront between local x0..x1 (pilasters, riser, fascia with the name, display window, glazed door, awning) */
const shopFront = (C: Ctx, MX: THREE.Matrix4, grp: THREE.Object3D, x0: number, x1: number, s: Shop) => {
  const add = (g: THREE.BufferGeometry, m: THREE.Material) => C.b.add(g, m, MX), c = col(s.col), ct = col(lighten(s.col, 0.25));
  const fy = H0 - 1.32;
  add(boxGeo(V(x0, 0, 0), V(x0 + 0.26, fy, 0.22)), c); add(boxGeo(V(x1 - 0.26, 0, 0), V(x1, fy, 0.22)), c);
  add(boxGeo(V(x0 + 0.26, 0, 0), V(x1 - 0.26, 0.62, 0.16)), c); add(boxGeo(V(x0 + 0.3, 0.2, 0.16), V(x1 - 0.3, 0.5, 0.18)), ct);
  add(boxGeo(V(x0 - 0.04, fy, 0), V(x1 + 0.04, H0 - 0.34, 0.3)), c); add(boxGeo(V(x0 - 0.06, H0 - 0.4, 0), V(x1 + 0.06, H0 - 0.3, 0.36)), ct);
  const dw = 1.05, dx = x1 - 0.26 - dw;
  add(quad(V(x0 + 0.26, 0.62, 0.07), V(dx - 0.08, 0.62, 0.07), V(dx - 0.08, fy, 0.07), V(x0 + 0.26, fy, 0.07)), lam("pGoodsM" + s.goods, () => ({ map: goodsTex(s.goods) })));
  add(boxGeo(V(dx - 0.08, 0, 0), V(dx, fy, 0.18)), c);
  add(quad(V(dx, 0, 0.04), V(dx + dw, 0, 0.04), V(dx + dw, fy, 0.04), V(dx, fy, 0.04)), lam("pDoorM" + s.col, () => ({ map: doorTex(s.col) })));
  const tw = x1 - x0 - 0.5, key = "shop" + s.name;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(tw, 0.62), unlit(key, () => textTex(key, s.name, 1024, Math.max(64, Math.round(1024 * 0.62 / tw)), s.col, "#f2cf6a", { border: "rgba(242,207,106,0.6)", outline: "rgba(20,10,10,0.5)" })));
  m.position.set((x0 + x1) / 2, fy + 0.49, 0.305); grp.add(m);
  if (s.awn) awning(C, grp, x0 + 0.08, x1 - 0.08, fy - 0.04, s.awn[0], s.awn[1]);
};
const porteCochere = (C: Ctx, MX: THREE.Matrix4, x0: number, x1: number, wallTrim: THREE.Material) => {
  const add = (g: THREE.BufferGeometry, m: THREE.Material) => C.b.add(g, m, MX), xc = (x0 + x1) / 2;
  add(quad(V(xc - 1.15, 0, 0.03), V(xc + 1.15, 0, 0.03), V(xc + 1.15, 3.8, 0.03), V(xc - 1.15, 3.8, 0.03)), lam("pCochere", () => ({ map: doorTex("#2f4a3e", false) })));
  add(boxGeo(V(xc - 1.45, 0, 0), V(xc - 1.15, 4.15, 0.16)), wallTrim); add(boxGeo(V(xc + 1.15, 0, 0), V(xc + 1.45, 4.15, 0.16)), wallTrim);
  add(boxGeo(V(xc - 1.45, 3.8, 0), V(xc + 1.45, 4.15, 0.16)), wallTrim); add(boxGeo(V(xc - 0.2, 3.7, 0), V(xc + 0.2, 4.25, 0.2)), wallTrim);
};
type HOpts = { style: number; shops: "auto" | "none" | "custom"; seed: number; ends?: ("0" | "W")[]; chimney?: boolean };
const haus = (C: Ctx, side: 1 | -1, zA: number, zB: number, o: HOpts) => { const { W, MX } = frameOf(side, zA, zB); return hausAt(C, MX, W, o); };
const hausAt = (C: Ctx, MX: THREE.Matrix4, W: number, o: HOpts) => {
  const grp = groupAt(C.root, MX), st = styMats(o.style), r = rng(o.seed);
  const nb = Math.max(3, Math.round(W / 3)), bw = W / nb, ks = bw / 3;
  const add = (g: THREE.BufferGeometry, m: THREE.Material) => C.b.add(g, m, MX);
  add(boxGeo(V(0, -SW, -12), V(W, CORN, -0.06), 4), st.plain);
  add(quad(V(0, 0, 0), V(W, 0, 0), V(W, H0, 0), V(0, H0, 0), nb, 1), st.rustic);
  add(quad(V(0, H0, 0), V(W, H0, 0), V(W, CORN, 0), V(0, CORN, 0), nb, 1), st.front);
  for (const e of o.ends ?? []) {
    const x = e === "0" ? 0 : W, s = e === "0" ? -1 : 1, nd = 4;
    const q = (y0: number, y1: number, m: THREE.Material, u: number) => add(s < 0 ? quad(V(x - 0.01, y0, -12), V(x - 0.01, y0, 0), V(x - 0.01, y1, 0), V(x - 0.01, y1, -12), u, 1) : quad(V(x + 0.01, y0, 0), V(x + 0.01, y0, -12), V(x + 0.01, y1, -12), V(x + 0.01, y1, 0), u, 1), m);
    q(0, H0, st.rustic, nd); q(H0, CORN, st.front, nd);
  }
  add(boxGeo(V(-0.02, H0 - 0.32, 0), V(W + 0.02, H0 + 0.04, 0.38)), st.trim);
  for (const k of [2, 3]) add(boxGeo(V(0, H0 + k * FL - 0.1, 0), V(W, H0 + k * FL + 0.03, 0.1)), st.trim);
  add(boxGeo(V(-0.05, CORN - 0.52, 0), V(W + 0.05, CORN - 0.3, 0.3)), st.trim);
  add(boxGeo(V(-0.1, CORN - 0.3, 0), V(W + 0.1, CORN + 0.12, 0.6)), st.trim);
  for (let i = 0; i < nb * 3; i++) add(boxGeo(V((i + 0.5) * W / (nb * 3) - 0.07, CORN - 0.32, 0.28), V((i + 0.5) * W / (nb * 3) + 0.07, CORN - 0.12, 0.5)), st.trim);
  // two continuous balconies (2nd + 5th floor) and balconnets on the others
  for (const k of [1, 4]) {
    const y = H0 + k * FL;
    add(boxGeo(V(0.05, y - 0.18, 0), V(W - 0.05, y, 0.9)), st.trim);
    for (let i = 0; i < nb; i++) for (const s of [-1, 1]) { const x = (i + 0.5) * bw + s * 0.95; add(boxGeo(V(x - 0.06, y - 0.42, 0), V(x + 0.06, y - 0.18, 0.32)), st.trim); add(boxGeo(V(x - 0.06, y - 0.3, 0.32), V(x + 0.06, y - 0.18, 0.62)), st.trim); }
    C.rails.add(quad(V(0.05, y, 0.88), V(W - 0.05, y, 0.88), V(W - 0.05, y + 1.0, 0.88), V(0.05, y + 1.0, 0.88), W - 0.1, 1), railM(), MX);
    C.rails.add(quad(V(0.05, y, 0), V(0.05, y, 0.88), V(0.05, y + 1, 0.88), V(0.05, y + 1, 0), 0.88, 1), railM(), MX);
    C.rails.add(quad(V(W - 0.05, y, 0.88), V(W - 0.05, y, 0), V(W - 0.05, y + 1, 0), V(W - 0.05, y + 1, 0.88), 0.88, 1), railM(), MX);
  }
  for (let k = 0; k < 5; k++) for (let i = 0; i < nb; i++) {
    const xc = (i + 0.5) * bw, ww = WIN_W * ks, y0 = H0 + k * FL + SILL, v = Math.floor(r() * 4);
    C.glass.add(quad(V(xc - ww / 2, y0, 0.015), V(xc + ww / 2, y0, 0.015), V(xc + ww / 2, y0 + WIN_H, 0.015), V(xc - ww / 2, y0 + WIN_H, 0.015), (v + 1) / 4, 1, v / 4, 0), mat("pGlassDayM", () => twoTone(new THREE.MeshLambertMaterial({ map: glassAtlas(false) }))), MX);
    if (r() < 0.38) { const lv = Math.floor(r() * 4); C.lit.add(quad(V(xc - ww / 2, y0, 0.02), V(xc + ww / 2, y0, 0.02), V(xc + ww / 2, y0 + WIN_H, 0.02), V(xc - ww / 2, y0 + WIN_H, 0.02), (lv + 1) / 4, 1, lv / 4, 0), litWinM(), MX); }
    if (k !== 1 && k !== 4) {
      const y = H0 + k * FL, hw = ww / 2 + 0.14;
      add(boxGeo(V(xc - hw - 0.05, y - 0.06, 0), V(xc + hw + 0.05, y + 0.07, 0.22)), st.trim);
      C.rails.add(quad(V(xc - hw, y + 0.07, 0.2), V(xc + hw, y + 0.07, 0.2), V(xc + hw, y + 0.95, 0.2), V(xc - hw, y + 0.95, 0.2), hw * 2, 0.88), railM(), MX);
    }
  }
  // mansard: steep slate face, zinc break, upper slope, dormers, party walls, chimneys
  const m0 = CORN + 0.12, m1 = CORN + 3.3, m2 = CORN + 4.5;
  add(quad(V(0, m0, -0.1), V(W, m0, -0.1), V(W, m1, -1.3), V(0, m1, -1.3), W / 4, 3.4 / 4), slate());
  add(quad(V(0, m1, -1.3), V(W, m1, -1.3), V(W, m2, -5), V(0, m2, -5), W / 4, 3.9 / 4), slate());
  add(quad(V(0, m2, -5), V(W, m2, -5), V(W, m2, -12), V(0, m2, -12)), zinc());
  add(boxGeo(V(0, m1 - 0.08, -1.42), V(W, m1 + 0.08, -1.18)), zinc());
  for (let i = 0; i < nb; i++) {
    const xc = (i + 0.5) * bw;
    add(boxGeo(V(xc - 0.62, m0 + 0.3, -1.7), V(xc + 0.62, m0 + 2.35, -0.22)), st.trim);
    const v = Math.floor(r() * 4);
    C.glass.add(quad(V(xc - 0.36, m0 + 0.7, -0.21), V(xc + 0.36, m0 + 0.7, -0.21), V(xc + 0.36, m0 + 2.0, -0.21), V(xc - 0.36, m0 + 2.0, -0.21), (v + 1) / 4, 1, v / 4, 0), mat("pGlassDayM", () => twoTone(new THREE.MeshLambertMaterial({ map: glassAtlas(false) }))), MX);
    if (r() < 0.3) C.lit.add(quad(V(xc - 0.36, m0 + 0.7, -0.2), V(xc + 0.36, m0 + 0.7, -0.2), V(xc + 0.36, m0 + 2.0, -0.2), V(xc - 0.36, m0 + 2.0, -0.2), (v + 1) / 4, 1, v / 4, 0), litWinM(), MX);
    add(new THREE.CylinderGeometry(0.7, 0.7, 1.56, 14, 1, false, Math.PI / 2, Math.PI).rotateX(Math.PI / 2).translate(xc, m0 + 2.35, -0.96), zinc());
  }
  for (const x of [0, W]) {
    add(boxGeo(V(x - 0.16, CORN, -12), V(x + 0.16, m1, -0.25)), st.plain);
    add(boxGeo(V(x - 0.16, m1, -12), V(x + 0.16, m2 + 0.15, -1.3)), st.plain);
  }
  if (o.chimney !== false) for (const x of r() < 0.5 ? [0] : [0, W * 0.5]) {
    add(boxGeo(V(x - 0.5, m1 - 0.4, -4.3), V(x + 0.5, m2 + 1.7, -2.5)), st.plain);
    add(boxGeo(V(x - 0.56, m2 + 1.6, -4.36), V(x + 0.56, m2 + 1.75, -2.44)), st.trim);
    for (let k = 0; k < 3; k++) add(new THREE.CylinderGeometry(0.1, 0.13, 0.55, 10).translate(x - 0.3 + k * 0.3, m2 + 2.02, -3.4), col("#c0623e"));
    if (r() < 0.55) C.smoke.push(loc(MX, x - 0.3 + Math.floor(r() * 3) * 0.3, m2 + 2.4, -3.4));
  }
  // ground floor
  if (o.shops === "auto") {
    const plan: [number, number, boolean][] = nb <= 4 ? [[0, 2, true], [2, nb, true]] : nb === 5 ? [[0, 2, true], [2, 3, false], [3, 5, true]] : nb === 6 ? [[0, 2, true], [2, 3, false], [3, 4, true], [4, 6, true]]
      : Array.from({ length: Math.floor(nb / 2) }, (_, k) => [k * 2, k * 2 + 2, k % 3 !== 1] as [number, number, boolean]);
    for (const [i0, i1, shop] of plan) {
      if (shop) shopFront(C, MX, grp, i0 * bw + 0.15, i1 * bw - 0.15, SHOPS[shopI++ % SHOPS.length]);
      else porteCochere(C, MX, i0 * bw, i1 * bw, st.trim);
    }
  }
  return { MX, grp, W, st };
};
const litWinM = () => mat("pGlassLitM", () => new THREE.MeshBasicMaterial({ map: glassAtlas(true), color: new THREE.Color(1.15, 1.08, 0.95) }));

// ---------------- street furniture ----------------
const ironM = () => lam("pIron", () => ({ color: "#26332e" }));
/** cast-iron candelabra lamp post; returns lantern glass position */
const lampPost = (b: Batch, glassB: Batch, x: number, z: number): V3 => {
  const y = SW, i = ironM();
  b.add(new THREE.CylinderGeometry(0.22, 0.3, 0.95, 12).translate(x, y + 0.48, z), i);
  b.add(new THREE.TorusGeometry(0.24, 0.05, 6, 16).rotateX(Math.PI / 2).translate(x, y + 0.95, z), i);
  b.add(new THREE.CylinderGeometry(0.075, 0.11, 3.0, 10).translate(x, y + 2.45, z), i);
  for (const yy of [1.6, 3.5]) b.add(new THREE.SphereGeometry(0.12, 10, 8).translate(x, y + yy, z), i);
  b.add(new THREE.CylinderGeometry(0.12, 0.06, 0.25, 8).translate(x, y + 4.02, z), i);
  glassB.add(new THREE.CylinderGeometry(0.26, 0.16, 0.6, 6).translate(x, y + 4.45, z), lampGlass());
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + Math.PI / 6; b.add(rodGeo([x + Math.cos(a) * 0.16, y + 4.15, z + Math.sin(a) * 0.16], [x + Math.cos(a) * 0.265, y + 4.76, z + Math.sin(a) * 0.265], 0.018, 4), i); }
  b.add(new THREE.ConeGeometry(0.36, 0.32, 6).translate(x, y + 4.92, z), i);
  b.add(new THREE.SphereGeometry(0.06, 8, 6).translate(x, y + 5.12, z), i);
  return [x, y + 4.45, z];
};
const lampGlass = () => mat("pLampGlass", () => new THREE.MeshBasicMaterial({ color: new THREE.Color("#dfe4e0") }));
const planeTree = (b: Batch, x: number, z: number, seed: number) => {
  const r = rng(seed * 11 + 5), bark = lam("pBark", () => ({ map: barkTex() })), leaf = lam("pLeafPlane", () => ({ map: leafTex("plane", "#6aa648", "#9ccc62", "#447f36") }));
  const y = SW, h = 5.4 + r() * 0.6, lean = (r() - 0.5) * 0.3;
  b.add(new THREE.CylinderGeometry(0.19, 0.27, h, 10).translate(x, y + h / 2, z), bark);
  for (let k = 0; k < 3; k++) { const a = r() * TAU, l = 1.6 + r(); b.add(rodGeo([x, y + h - 0.6, z], [x + Math.cos(a) * l * 0.6 + lean, y + h + 1.2 + r(), z + Math.sin(a) * l * 0.6], 0.1, 6), bark); }
  const n = 6 + Math.floor(r() * 2);
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + r(), d = k === 0 ? 0 : 1.3 + r() * 0.9, rr = 1.5 + r() * 0.8;
    b.add(new THREE.IcosahedronGeometry(rr, 2).scale(1, 0.85, 1).translate(x + Math.cos(a) * d + lean, y + h + 1.6 + r() * 1.8 + (k === 0 ? 1 : 0), z + Math.sin(a) * d), leaf);
  }
  b.add(new THREE.CircleGeometry(0.78, 20).rotateX(-Math.PI / 2).translate(x, y + 0.003, z), col("#5e4c3c"));
  b.add(new THREE.CircleGeometry(0.8, 20).rotateX(-Math.PI / 2).translate(x, y + 0.007, z), cut("grate", grateTex));
};
const bench = (b: Batch, x: number, z: number, yaw: number) => {
  const M = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, SW, z), wood = col("#3f6a4a"), i = ironM();
  for (const s of [-0.75, 0.75]) { b.add(boxGeo(V(s - 0.04, 0, -0.25), V(s + 0.04, 0.45, 0.25)), i, M); b.add(boxGeo(V(s - 0.04, 0.45, -0.28), V(s + 0.04, 0.9, -0.2)), i, M); }
  for (let k = 0; k < 3; k++) b.add(boxGeo(V(-0.95, 0.42, -0.24 + k * 0.17), V(0.95, 0.47, -0.12 + k * 0.17)), wood, M);
  for (let k = 0; k < 2; k++) b.add(boxGeo(V(-0.95, 0.58 + k * 0.17, -0.27), V(0.95, 0.7 + k * 0.17, -0.22)), wood, M);
};

// ---------------- the Eiffel Tower (title object: clean, recognisable silhouette, pre-hazed, unfogged) ----------------
const tower = (parent: THREE.Object3D, pos: V3, s: number) => {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); parent.add(g);
  const m = mat("pTowerM", () => twoTone(new THREE.MeshLambertMaterial({ map: latticeTex(), fog: false }), 2.6));
  const solid = mat("pTowerS", () => twoTone(new THREE.MeshLambertMaterial({ color: "#b48a78", fog: false }), 2.6));
  const b = new Batch(), O = (y: number) => 62.5 * Math.exp(-y / 118);
  const loft = (secs: [number, number, number, number, number][], mm: THREE.Material) => {
    for (let i = 0; i + 1 < secs.length; i++) {
      const [ya, ax0, ax1, az0, az1] = secs[i], [yb, bx0, bx1, bz0, bz1] = secs[i + 1], v0 = ya / 8, v1 = yb / 8;
      b.add(quad(V(ax0, ya, az1), V(ax1, ya, az1), V(bx1, yb, bz1), V(bx0, yb, bz1), (ax1 - ax0) / 8, v1, 0, v0), mm);
      b.add(quad(V(ax1, ya, az0), V(ax0, ya, az0), V(bx0, yb, bz0), V(bx1, yb, bz0), (ax1 - ax0) / 8, v1, 0, v0), mm);
      b.add(quad(V(ax1, ya, az1), V(ax1, ya, az0), V(bx1, yb, bz0), V(bx1, yb, bz1), (az1 - az0) / 8, v1, 0, v0), mm);
      b.add(quad(V(ax0, ya, az0), V(ax0, ya, az1), V(bx0, yb, bz1), V(bx0, yb, bz0), (az1 - az0) / 8, v1, 0, v0), mm);
    }
  };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    loft([0, 12, 26, 40, 57, 72, 88, 102, 118].map((y) => {
      const o = O(y), lw = lerp(24, 10.5, y / 118), a = o - lw;
      const [x0, x1] = sx > 0 ? [a, o] : [-o, -a], [z0, z1] = sz > 0 ? [a, o] : [-o, -a];
      return [y, x0, x1, z0, z1] as [number, number, number, number, number];
    }), m);
    b.add(boxGeo(V(sx * O(0) - 14, -1, sz * O(0) - 14), V(sx * O(0) + 14, 2, sz * O(0) + 14)).translate(-sx * 12, 0, -sz * 12), solid); // masonry piers
  }
  loft([112, 135, 160, 190, 220, 250, 276].map((y) => { const o = O(y); return [y, -o, o, -o, o] as [number, number, number, number, number]; }), m);
  loft([[276, -5.5, 5.5, -5.5, 5.5], [285, -5.5, 5.5, -5.5, 5.5], [287, -3.6, 3.6, -3.6, 3.6], [297, -2.2, 2.2, -2.2, 2.2]], solid);
  b.add(new THREE.CylinderGeometry(1.2, 1.6, 6, 12).translate(0, 300, 0), solid);
  b.add(new THREE.CylinderGeometry(0.25, 0.45, 14, 6).translate(0, 310, 0), solid);
  for (const [y, h, hw] of [[55, 7, 40], [114, 4.5, 25.5], [275, 3.2, 8.5]] as [number, number, number][]) {
    b.add(boxGeo(V(-hw, y, -hw), V(hw, y + h, hw), 8), m);
    b.add(boxGeo(V(-hw - 0.8, y + h, -hw - 0.8), V(hw + 0.8, y + h + 1.2, hw + 0.8)), solid);
  }
  for (let f = 0; f < 4; f++) {
    const pts = Array.from({ length: 25 }, (_, i) => { const th = (i / 24) * Math.PI; return V(-27.5 * Math.cos(th), 21 + 30 * Math.sin(th), 37.5); });
    b.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 1.5, 6, false).rotateY((f * Math.PI) / 2), solid);
  }
  b.build(g, false);
  g.traverse((o) => { o.frustumCulled = false; });
  const beacon = glow(g, [0, 312, 0], "#ffd890", 30, 1);
  return { g, beacon };
};

// ---------------- the set ----------------
export const street = (): SetDef => {
  const root = new THREE.Group(), b = new Batch();
  const C: Ctx = { b, glass: new Batch(), lit: new Batch(), rails: new Batch(), root, hems: [], smoke: [], r: rng(1925) };
  shopI = 0;
  // ---- ground: cobbled carriageway, granite curbs + gutters, pale stone sidewalks, cross avenue, far ground ----
  const cob = lam("pCobble", () => ({ map: cobbleHD() }));
  b.add(quad(V(-CURB, 0, 168), V(CURB, 0, 168), V(CURB, 0, -260), V(-CURB, 0, -260), (2 * CURB) / 4, 428 / 4), cob);
  b.add(quad(V(-46, 0, 168), V(-CURB, 0, 168), V(-CURB, 0, 131), V(-46, 0, 131), 37.5 / 4, 37 / 4), cob); b.add(quad(V(CURB, 0, 168), V(46, 0, 168), V(46, 0, 131), V(CURB, 0, 131), 37.5 / 4, 37 / 4), cob);
  b.add(quad(V(-120, 0, -124), V(-CURB, 0, -124), V(-CURB, 0, -156), V(-120, 0, -156), 112 / 4, 32 / 4), cob);
  b.add(quad(V(CURB, 0, -124), V(120, 0, -124), V(120, 0, -156), V(CURB, 0, -156), 112 / 4, 32 / 4), cob);
  const walk = lam("pWalk", () => ({ map: stoneHD("pWalkHD", ["#ddd5c6", "#d4cbbb", "#e4ddcf", "#cfc6b5"], "#a89e8e") }));
  const granite = lam("pGranite", () => ({ color: "#9c9a9e" })), gutter = lam("pGutter", () => ({ color: "#8e877c" }));
  for (const [z0, z1] of [[131, -124], [-156, -260]] as [number, number][]) for (const s of [-1, 1]) {
    const xi = s * (CURB + 0.25), xo = s * 30;
    b.add(s > 0 ? quad(V(xi, SW, z0), V(xo, SW, z0), V(xo, SW, z1), V(xi, SW, z1), (xo - xi) / 2, (z0 - z1) / 2) : quad(V(xo, SW, z0), V(xi, SW, z0), V(xi, SW, z1), V(xo, SW, z1), (xi - xo) / 2, (z0 - z1) / 2), walk);
    b.add(boxGeo(V(Math.min(s * CURB, s * (CURB + 0.25)), 0, z1), V(Math.max(s * CURB, s * (CURB + 0.25)), SW + 0.005, z0)), granite);
    b.add(quad(V(s > 0 ? CURB - 0.35 : -CURB, 0.004, z0), V(s > 0 ? CURB : -CURB + 0.35, 0.004, z0), V(s > 0 ? CURB : -CURB + 0.35, 0.004, z1), V(s > 0 ? CURB - 0.35 : -CURB, 0.004, z1)), gutter);
  }
  b.add(quad(V(-400, -0.02, -260), V(400, -0.02, -260), V(400, -0.02, -900), V(-400, -0.02, -900), 100, 160), lam("pGravel", () => ({ color: "#d8c8a4" })));
  for (const s of [-1, 1]) b.add(quad(V(s > 0 ? 12 : -70, -0.01, -270), V(s > 0 ? 70 : -12, -0.01, -270), V(s > 0 ? 70 : -12, -0.01, -390), V(s > 0 ? 12 : -70, -0.01, -390)), lam("pLawn", () => ({ color: "#7fb655" })));
  // ---- Haussmann blocks ----
  const R: [number, number][] = [[116, 131], [101, 116], [86, 101], [71, 86], [56, 71], [41, 56], [27, 41], [9, 27], [-21, -6], [-33, -21], [-51, -33], [-66, -51], [-81, -66], [-96, -81], [-110, -96], [-124, -110]];
  const L: [number, number][] = [[116, 131], [101, 116], [86, 101], [71, 86], [56, 71], [41, 56], [11, 26], [-7, 11], [-22, -7], [-34, -22], [-49, -34], [-67, -49], [-82, -67], [-94, -82], [-109, -94], [-124, -109]];
  R.forEach(([a, z], i) => haus(C, 1, a, z, { style: i % 3, shops: "auto", seed: 100 + i, ends: a === -124 ? ["0"] : z === 131 ? ["W"] : [] }));
  L.forEach(([a, z], i) => haus(C, -1, a, z, { style: (i + 1) % 3, shops: "auto", seed: 200 + i, ends: a === -124 ? ["W"] : z === 131 ? ["0"] : [] }));
  // the vista behind the camera end (+z): a wide domed building closing the boulevard at z = 165
  hausAt(C, new THREE.Matrix4().makeRotationY(Math.PI).setPosition(45, SW, 165), 90, { style: 1, shops: "auto", seed: 555 });
  {
    const dc = V(0, CORN + 4.6, 174), copper = lam("pCopper", () => ({ map: roofHD("#5f9a86", true) })), stoneT = styMats(1).trim;
    b.add(new THREE.CylinderGeometry(9.5, 10, 5, 24).translate(dc.x, dc.y + 2.5, dc.z), styMats(1).plain);
    for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU; b.add(boxGeo(V(-0.35, 0, -0.35), V(0.35, 5, 0.35)).translate(dc.x + Math.cos(a) * 10.1, dc.y, dc.z + Math.sin(a) * 10.1), stoneT); }
    b.add(new THREE.SphereGeometry(10, 28, 14, 0, TAU, 0, Math.PI / 2).scale(1, 1.15, 1).translate(dc.x, dc.y + 5, dc.z), copper);
    b.add(new THREE.CylinderGeometry(1.4, 1.6, 3, 12).translate(dc.x, dc.y + 17, dc.z), stoneT); b.add(new THREE.ConeGeometry(1.7, 2.6, 12).translate(dc.x, dc.y + 19.8, dc.z), copper);
    b.add(new THREE.SphereGeometry(0.5, 10, 8).translate(dc.x, dc.y + 21.4, dc.z), shiny("gold", "#e2b24a", 70));
    for (const x of [-30, 30]) { b.add(boxGeo(V(x - 3, CORN, 166), V(x + 3, CORN + 6, 172)), styMats(1).plain); b.add(new THREE.ConeGeometry(4.4, 4, 4).rotateY(Math.PI / 4).translate(x, CORN + 8, 169), copper); }
  }
  const FAR: [number, number][] = [[-171, -156], [-189, -171], [-204, -189], [-219, -204], [-234, -219], [-246, -234]];
  FAR.forEach(([a, z], i) => { haus(C, 1, a, z, { style: i % 3, shops: "none", seed: 300 + i, ends: z === -156 ? ["W"] : [], chimney: i % 2 === 0 }); haus(C, -1, a, z, { style: (i + 2) % 3, shops: "none", seed: 400 + i, ends: z === -156 ? ["0"] : [], chimney: i % 2 === 1 }); });
  // ---- CAFÉ DU BOULON (right, facade z -6..9) ----
  const cafe = haus(C, 1, -6, 9, { style: 1, shops: "custom", seed: 77 });
  {
    const { MX, grp } = cafe, add = (g: THREE.BufferGeometry, m: THREE.Material) => b.add(g, m, MX), red = col("#7c1e26"), redL = col("#9a2a32"), gold = shiny("gold", "#e2b24a", 70);
    const fy = H0 - 1.28;
    for (const x of [0.1, 3.0, 6.0, 9.0, 12.0, 14.9]) add(boxGeo(V(x - 0.18, 0, 0), V(x + 0.18, fy, 0.26)), red);
    add(boxGeo(V(0, 0, 0), V(15, 0.55, 0.18)), red); add(boxGeo(V(0.1, 0.18, 0.18), V(14.9, 0.45, 0.2)), redL);
    add(boxGeo(V(-0.06, fy, 0), V(15.06, H0 - 0.32, 0.32)), red); add(boxGeo(V(-0.1, H0 - 0.42, 0), V(15.1, H0 - 0.3, 0.4)), gold); add(boxGeo(V(-0.1, fy - 0.06, 0), V(15.1, fy + 0.02, 0.36)), gold);
    const winM = mat("pCafeWinM", () => new THREE.MeshBasicMaterial({ map: cafeTex() }));
    for (const [x0, x1] of [[0.28, 2.82], [6.18, 8.82], [9.18, 11.82], [12.18, 14.72]]) add(quad(V(x0, 0.55, 0.08), V(x1, 0.55, 0.08), V(x1, fy, 0.08), V(x0, fy, 0.08)), winM);
    add(quad(V(3.18, 0.55, 0.08), V(3.9, 0.55, 0.08), V(3.9, fy, 0.08), V(3.18, fy, 0.08), 0.28, 1), winM); add(quad(V(5.1, 0.55, 0.08), V(5.82, 0.55, 0.08), V(5.82, fy, 0.08), V(5.1, fy, 0.08), 0.28, 1), winM);
    add(quad(V(3.9, 0, 0.05), V(5.1, 0, 0.05), V(5.1, fy, 0.05), V(3.9, fy, 0.05)), lam("pCafeDoor", () => ({ map: doorTex("#7c1e26") })));
    for (const x of [3.86, 5.14]) add(boxGeo(V(x - 0.05, 0, 0), V(x + 0.05, fy, 0.16)), red);
    const fas = new THREE.Mesh(new THREE.PlaneGeometry(14.4, 0.84), unlit("cafeFascia", () => ctex("pCafeFascia", 4096, 240, (g) => {
      g.fillStyle = "#7c1e26"; g.fillRect(0, 0, 4096, 240); g.strokeStyle = "#f4cc5c"; g.lineWidth = 6; g.strokeRect(10, 12, 4076, 216);
      g.textAlign = "center"; g.textBaseline = "middle";
            // name centred over the door (local x 5.5 = world z -0.5), where the terrace cameras look
      g.fillStyle = "rgba(30,6,8,0.6)"; fitText(g, "CAFÉ DU BOULON", 1485, 132, 1260, 170, SERIF); g.fillStyle = "#f6d06a"; fitText(g, "CAFÉ DU BOULON", 1479, 126, 1260, 170, SERIF);
      g.fillStyle = "#f2c65a"; fitText(g, "VINS · LIQUEURS", 400, 126, 620, 74, "700 %spx Georgia, serif"); fitText(g, "BIÈRES  ·  CAFÉ  ·  DÉJEUNERS", 3070, 126, 1700, 74, "700 %spx Georgia, serif");
      for (const x of [790, 2170]) { g.beginPath(); g.arc(x, 120, 14, 0, TAU); g.fill(); }
    })));
    fas.position.set(7.5, fy + 0.5, 0.33); grp.add(fas);
    awning(C, grp, 0.05, 14.95, fy - 0.08, "#f3e6cc", "#b8282e", 3.3, 0.6);
    // the door plaque (swings) and a blade sign at the corner (swings)
    const plaque = new THREE.Group(); plaque.position.set(4.5, 2.25, 0.09); grp.add(plaque);
    const pq = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.2).translate(0, -0.2, 0), unlit("ouvert", () => textTex("ouvert", "OUVERT", 512, 220, "#f4ead2", "#7c1e26", { border: "#7c1e26" }))); plaque.add(pq);
    plaque.add(new THREE.Mesh(rodGeo([-0.12, -0.1, 0], [0, 0, 0], 0.006, 3), col("#c9a24a")), new THREE.Mesh(rodGeo([0.12, -0.1, 0], [0, 0, 0], 0.006, 3), col("#c9a24a")));
    const blade = new THREE.Group(); blade.position.set(15.3, 4.0, 0.75); grp.add(blade);
    b.add(rodGeo([15.3, 4.05, 0], [15.3, 4.05, 1.35], 0.03), ironM(), MX); b.add(rodGeo([15.3, 3.55, 0], [15.3, 4.05, 0.9], 0.02), ironM(), MX);
    const bl = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.62).rotateY(Math.PI / 2).translate(0, -0.4, 0), mat("pBlade", () => { const m = new THREE.MeshBasicMaterial({ map: textTex("blade", "CAFÉ\nDU BOULON", 512, 320, "#7c1e26", "#f4cc5c", { border: "#f4cc5c", size: 0.8 }), side: THREE.DoubleSide }); signMats.push(m); return m; }));
    blade.add(bl); for (const z of [-0.35, 0.35]) blade.add(new THREE.Mesh(rodGeo([0, 0, z], [0, -0.09, z], 0.008, 3), ironM()));
    root.userData.cafeSwing = [plaque, blade];
  }
  // café terrace: marble tables, wicker bistro chairs, cups, carafe, newspaper, planters, the menu board
  const TABLES: [number, number][] = [[14.3, -4.4], [14.3, 2.2], [14.3, 6.2], [12.0, -2.8], [12.0, 1.0], [12.0, 4.8]];
  {
    const marble = shiny("marble", "#f2eee8", 30), iron = ironM(), wick = lam("pWicker", () => ({ map: weaveTex("#c79a5a") })), bent = col("#5a3824");
    const cup = col("#fbf8f2"), coffee = col("#4a2a1a");
    const chair = (x: number, z: number, yaw: number) => {
      const M = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, SW, z);
      b.add(new THREE.CylinderGeometry(0.21, 0.2, 0.05, 16).translate(0, 0.46, 0), wick, M);
      for (const [a, c] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]) b.add(rodGeo([a * 1.15, 0, c * 1.15], [a, 0.45, c], 0.016, 5), bent, M);
      for (const sx of [-0.18, 0.18]) b.add(rodGeo([sx, 0.46, -0.16], [sx * 1.05, 0.86, -0.22], 0.016, 5), bent, M);
      b.add(new THREE.TorusGeometry(0.189, 0.018, 6, 16, Math.PI).translate(0, 0.86, -0.22), bent, M);
      b.add(new THREE.BoxGeometry(0.36, 0.17, 0.025).rotateX(0.14).translate(0, 0.76, -0.205), wick, M);
      b.add(new THREE.TorusGeometry(0.17, 0.014, 5, 16).rotateX(Math.PI / 2).translate(0, 0.22, 0), bent, M);
    };
    TABLES.forEach(([x, z], i) => {
      b.add(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 22).translate(x, SW + 0.73, z), marble);
      b.add(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 8).translate(x, SW + 0.37, z), iron); b.add(new THREE.CylinderGeometry(0.06, 0.24, 0.05, 14).translate(x, SW + 0.025, z), iron);
      for (const s of [-1, 1]) chair(x, z + s * 0.64, s > 0 ? Math.PI : 0);
      if (i !== 4 && i % 2 === 0) chair(x + 0.62, z, -Math.PI / 2);
      for (let k = 0; k < (i === 4 ? 2 : 1 + (i % 2)); k++) {
        const cx = x - 0.1 + k * 0.2, cz = z + (k ? 0.12 : -0.12);
        b.add(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 14).translate(cx, SW + 0.756, cz), cup);
        b.add(new THREE.CylinderGeometry(0.042, 0.034, 0.07, 12).translate(cx, SW + 0.795, cz), cup);
        b.add(new THREE.CircleGeometry(0.036, 12).rotateX(-Math.PI / 2).translate(cx, SW + 0.831, cz), coffee);
        b.add(new THREE.TorusGeometry(0.02, 0.006, 4, 8, Math.PI).rotateZ(-Math.PI / 2).translate(cx + 0.045, SW + 0.8, cz), cup);
      }
    });
    const carafe = mat("pCarafe", () => new THREE.MeshPhongMaterial({ color: "#cfe6f0", specular: "#ffffff", shininess: 90, transparent: true, opacity: 0.55 }));
    for (const [x, z] of [[14.3, 2.3], [12.0, 4.9]]) b.add(new THREE.LatheGeometry([[0, 0], [0.06, 0], [0.07, 0.08], [0.03, 0.16], [0.025, 0.24], [0.03, 0.25]].map(([a, c]) => new THREE.Vector2(a, c)), 14).translate(x + 0.12, SW + 0.75, z + 0.1), carafe);
    b.add(new THREE.BoxGeometry(0.3, 0.012, 0.42).rotateY(0.4).translate(11.9, SW + 0.757, 1.08), lam("pPaperFold", () => ({ map: paperTex("LA VOIX DU MATIN", "LA TOUR ROUILLE!") })));
    b.add(new THREE.CylinderGeometry(0.04, 0.035, 0.06, 10).translate(12.15, SW + 0.78, 0.84), cup);
    for (const z of [-5.6, 8.9]) { b.add(boxGeo(V(10.5, SW, z - 0.3), V(11.9, SW + 0.5, z + 0.3), 1), lam("pPlanter", () => ({ map: beamHD() }))); for (let k = 0; k < 7; k++) b.add(new THREE.SphereGeometry(0.13, 8, 6).translate(10.65 + k * 0.2, SW + 0.62, z + (k % 2 ? 0.1 : -0.1)), col(k % 3 ? "#d6334a" : "#3f7a3a")); }
    const mb = new THREE.Group(); mb.position.set(10.45, SW, -6.6); mb.rotation.y = Math.PI / 2 - 0.5; root.add(mb);
    for (const s of [-1, 1]) { const bd = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.86).translate(0, 0.47, 0).rotateX(s * 0.17).translate(0, 0, s * 0.08), mat("pChalkM", () => twoTone(new THREE.MeshLambertMaterial({ map: chalkTex(), side: THREE.DoubleSide })))); if (s < 0) bd.rotation.y = Math.PI; mb.add(bd); }
  }
  // ---- POLICE STATION (left, facade z 26..41) ----
  let policeFlag: THREE.Mesh, policeLampPos: V3, policeWallLamps: V3[];
  {
    const { MX } = frameOf(-1, 26, 41), grp = groupAt(root, MX), W = 15, add = (g: THREE.BufferGeometry, m: THREE.Material) => b.add(g, m, MX);
    const wall = "#e2d8c6", stone = lam("polPlain", () => ({ color: wall })), trim = lam("polTrim", () => ({ color: lighten(wall, 0.45) }));
    const PH0 = 5.0, PC = PH0 + 7.2;
    add(boxGeo(V(0, -SW, -12), V(W, PC, -0.06), 4), stone);
    add(quad(V(0, 0, 0), V(W, 0, 0), V(W, PH0, 0), V(0, PH0, 0), 5, 1), lam("polRustic", () => ({ map: rusticTex("police", "#d6cab4", PH0) })));
    add(quad(V(0, PH0, 0), V(W, PH0, 0), V(W, PC, 0), V(0, PC, 0), 5, 1), lam("polFront", () => ({ map: frontTex("police", wall, [3.6, 3.6], 1.3, 2.55, 0.18, ["ped", "flat"]) })));
    for (let k = 0; k < 2; k++) for (let i = 0; i < 5; i++) { const xc = 1.5 + i * 3, y0 = PH0 + k * 3.6 + 0.18, v = (i + k) % 4; C.glass.add(quad(V(xc - 0.65, y0, 0.015), V(xc + 0.65, y0, 0.015), V(xc + 0.65, y0 + 2.55, 0.015), V(xc - 0.65, y0 + 2.55, 0.015), (v + 1) / 4, 1, v / 4, 0), mat("pGlassDayM", () => twoTone(new THREE.MeshLambertMaterial({ map: glassAtlas(false) }))), MX); if ((i + k) % 2) C.lit.add(quad(V(xc - 0.65, y0, 0.02), V(xc + 0.65, y0, 0.02), V(xc + 0.65, y0 + 2.55, 0.02), V(xc - 0.65, y0 + 2.55, 0.02), 0.5, 1, 0.25, 0), litWinM(), MX); }
    add(boxGeo(V(-0.05, PH0 - 0.3, 0), V(W + 0.05, PH0 + 0.05, 0.4)), trim);
    add(boxGeo(V(0.05, PH0 + 3.6 - 0.18, 0), V(W - 0.05, PH0 + 3.6, 0.85)), trim);
    C.rails.add(quad(V(0.05, PH0 + 3.6, 0.83), V(W - 0.05, PH0 + 3.6, 0.83), V(W - 0.05, PH0 + 4.6, 0.83), V(0.05, PH0 + 4.6, 0.83), W, 1), railM(), MX);
    add(boxGeo(V(-0.1, PC - 0.3, 0), V(W + 0.1, PC + 0.15, 0.6)), trim);
    // pediment with a clock over the centre bay, slate roof, dormers
    const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.Float32BufferAttribute([4.5, PC + 0.15, 0.5, 10.5, PC + 0.15, 0.5, 7.5, PC + 2.3, 0.5], 3)); pg.computeVertexNormals(); pg.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
    add(pg, trim); add(boxGeo(V(4.5, PC + 0.15, -0.6), V(10.5, PC + 1.0, 0.5)), trim);
    const clk = new THREE.Mesh(new THREE.CircleGeometry(0.55, 28), lam("pClockM", () => ({ map: clockTex() }))); clk.position.set(7.5, PC + 0.95, 0.52); grp.add(clk);
    const r0 = PC + 0.15, r1 = PC + 3.4;
    add(quad(V(0, r0, -0.1), V(W, r0, -0.1), V(W, r1, -3.2), V(0, r1, -3.2), W / 4, 4.5 / 4), lam("pSlateD", () => ({ map: roofHD("#6e7a93", true) })));
    add(quad(V(0, r1, -3.2), V(W, r1, -3.2), V(W, r1, -12), V(0, r1, -12)), zinc());
    for (const x of [0, W]) add(boxGeo(V(x - 0.16, PC, -12), V(x + 0.16, r1 + 0.1, -0.25)), stone);
    for (const xc of [2.5, 12.5]) { add(boxGeo(V(xc - 0.55, r0 + 0.4, -2.2), V(xc + 0.55, r0 + 2.0, -0.7)), trim); C.glass.add(quad(V(xc - 0.32, r0 + 0.6, -0.69), V(xc + 0.32, r0 + 0.6, -0.69), V(xc + 0.32, r0 + 1.7, -0.69), V(xc - 0.32, r0 + 1.7, -0.69), 0.25, 1, 0, 0), mat("pGlassDayM", () => twoTone(new THREE.MeshLambertMaterial({ map: glassAtlas(false) }))), MX); add(new THREE.CylinderGeometry(0.6, 0.6, 1.6, 12, 1, false, Math.PI / 2, Math.PI).rotateX(Math.PI / 2).translate(xc, r0 + 2.0, -1.45), zinc()); }
    // door: arched surround, big blue double door at landing height, steps, handrails
    const LY = 0.68, door = lam("polDoor", () => ({ map: doorTex("#24407a", false) }));
    add(quad(V(6.3, LY, 0.03), V(8.7, LY, 0.03), V(8.7, LY + 2.7, 0.03), V(6.3, LY + 2.7, 0.03)), door);
    for (const x of [6.0, 9.0]) add(boxGeo(V(x - 0.3, 0, 0), V(x + 0.3, LY + 2.7, 0.3)), trim);
    add(boxGeo(V(5.6, LY + 2.7, 0), V(9.4, LY + 2.94, 0.34)), trim); add(boxGeo(V(7.3, LY + 2.62, 0), V(7.7, LY + 3.02, 0.38)), trim);
    add(boxGeo(V(5.35, PH0 - 1.24, 0), V(9.65, PH0 - 0.28, 0.4)), trim);
    signPlate(grp, "commissariat", "COMMISSARIAT\nDE POLICE", 4.05, 0.82, [7.5, PH0 - 0.76, 0.405], "#ece4d2", "#1f2f5a", { border: "#1f2f5a", size: 0.78 });
    const stepM = lam("polStep", () => ({ map: stoneHD("polStepHD", ["#d8d2c6", "#cfc8ba", "#e0dacd"], "#9a9284") }));
    [[0.17, 2.34], [0.34, 1.96], [0.51, 1.58], [LY, 1.2]].forEach(([y, z]) => add(boxGeo(V(5.4, -SW, 0), V(9.6, y, z), 1), stepM));
    for (const x of [5.5, 9.5]) {
      add(rodGeo([x, 1.07, 2.3], [x, 1.58, 1.15], 0.03), ironM()); add(rodGeo([x, 1.58, 1.15], [x, 1.58, 0.1], 0.03), ironM());
      for (const [z, y] of [[2.3, 0.17], [1.15, LY], [0.35, LY]]) add(rodGeo([x, y, z], [x, y + 0.9, z], 0.02), ironM());
    }
    // barred side windows on the ground floor
    for (const xc of [2.2, 12.8]) { const y0 = 1.3; C.glass.add(quad(V(xc - 0.7, y0, 0.015), V(xc + 0.7, y0, 0.015), V(xc + 0.7, y0 + 2.2, 0.015), V(xc - 0.7, y0 + 2.2, 0.015), 1, 1, 0.75, 0), mat("pGlassDayM", () => twoTone(new THREE.MeshLambertMaterial({ map: glassAtlas(false) }))), MX); for (let k = 0; k < 6; k++) add(rodGeo([xc - 0.6 + k * 0.24, y0, 0.1], [xc - 0.6 + k * 0.24, y0 + 2.2, 0.1], 0.022, 5), ironM()); add(boxGeo(V(xc - 0.85, y0 - 0.12, 0), V(xc + 0.85, y0, 0.2)), trim); }
    // notice board with posters
    add(boxGeo(V(3.0, 1.1, 0), V(4.6, 2.4, 0.06)), lam("pBoardWood", () => ({ map: beamHD() })));
    [["AVIS", "AU PUBLIC"], ["RECHERCHÉ", "RÉCOMPENSE"], ["ARRÊTÉ", "DU PRÉFET"]].forEach(([a, h], i) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.56), lam("polPoster" + i, () => ({ map: paperTex(a, h, ["#f2ead6", "#efe0b8", "#e6ecf2"][i]) }))); p.position.set(3.32 + i * 0.48, 1.76 + (i % 2) * 0.06, 0.065); p.rotation.z = (i - 1) * 0.04; grp.add(p); });
    // two blue POLICE globes on brackets flanking the door
    policeWallLamps = [];
    for (const x of [5.05, 9.95]) {
      add(rodGeo([x, 3.55, 0], [x, 3.55, 0.48], 0.035), ironM()); add(rodGeo([x, 2.95, 0], [x, 3.55, 0.3], 0.025), ironM());
      const globe = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.36, 16), mat("pPoliceGlobeM", () => new THREE.MeshBasicMaterial({ map: policeGlobe() })));
      globe.position.set(x, 3.26, 0.5); globe.layers.set(NOINK); grp.add(globe);
      add(new THREE.ConeGeometry(0.31, 0.2, 16).translate(x, 3.54, 0.5), ironM()); add(new THREE.CylinderGeometry(0.27, 0.27, 0.05, 16).translate(x, 3.06, 0.5), ironM());
      policeWallLamps.push(loc(MX, x, 3.26, 0.75));
    }
    policeLampPos = loc(MX, 7.5, 3.4, 1.2);
    // tricolour on a slanted pole from the balcony
    const fp = new THREE.Group(); fp.position.set(7.5, PH0 + 4.4, 0.85); fp.rotation.x = 0.75; grp.add(fp);
    fp.add(new THREE.Mesh(rodGeo([0, 0, 0], [0, 2.4, 0], 0.03), col("#e8e4da"))); fp.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6).translate(0, 2.42, 0), shiny("gold", "#e2b24a", 70)));
    policeFlag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8, 14, 4).translate(0.6, 0, 0).rotateZ(-Math.PI / 2).translate(0, 2.35, 0), ds("tri", () => tricolour("flag")));
    policeFlag.castShadow = true; fp.add(policeFlag);
    // gendarme sentry box (striped), beside the steps
    const gb = new THREE.Group(); gb.position.copy(V(...loc(MX, 11.6, 0, 1.0))); gb.rotation.y = Math.PI / 2; root.add(gb);
    const gm = lam("pGuerite", () => ({ map: guériteTex() }));
    for (const [x0, x1, z0, z1] of [[-0.55, -0.47, -0.5, 0.5], [0.47, 0.55, -0.5, 0.5], [-0.55, 0.55, -0.5, -0.42]]) { const bx = new THREE.Mesh(boxGeo(V(x0, 0, z0), V(x1, 2.3, z1)), gm); bx.castShadow = true; gb.add(bx); }
    const gr = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.55, 4).rotateY(Math.PI / 4).translate(0, 2.58, 0), col("#2a3a5a")); gr.castShadow = true; gb.add(gr);
    gb.add(new THREE.Mesh(boxGeo(V(-0.47, 0, -0.42), V(0.47, 0.08, 0.5)), lam("pBoardWood", () => ({ map: beamHD() }))));
    // ghost ad on the taller neighbour's exposed side wall (facing +z, over the police roof)
    const ad = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 4.5), lam("pGhostAdM", () => ({ map: ghostAd() }))); ad.position.set(-22.4, 18.3, 26.0 + 0.05); root.add(ad);
  }
  // ---- NEWSSTAND KIOSK (left sidewalk) + headline board ----
  const papers: THREE.Mesh[] = [];
  {
    const k = new THREE.Group(); k.position.set(...KIOSK); k.rotation.y = Math.PI / 2; root.add(k);
    const green = col("#2f5a3e"), greenD = col("#22432e"), gold = shiny("gold", "#e2b24a", 70), kb = new Batch();
    const P8 = Math.PI / 8, AP = 1.05 * Math.cos(P8);
    kb.add(new THREE.CylinderGeometry(1.05, 1.1, 2.45, 8).rotateY(P8).translate(0, 1.225, 0), green);
    kb.add(new THREE.CylinderGeometry(1.14, 1.14, 0.5, 8).rotateY(P8).translate(0, 0.25, 0), greenD);
    kb.add(boxGeo(V(-0.46, 0.95, 0.85), V(0.46, 1.02, 1.34)), greenD);
    kb.add(new THREE.CylinderGeometry(1.3, 1.22, 0.36, 8).rotateY(P8).translate(0, 2.62, 0), greenD);
    kb.add(new THREE.SphereGeometry(1.32, 16, 8, 0, TAU, 0, Math.PI / 2).scale(1, 0.62, 1).translate(0, 2.8, 0), lam("pKioskRoof", () => ({ map: roofHD("#5e7d6a", true) })));
    kb.add(new THREE.CylinderGeometry(0.08, 0.14, 0.35, 8).translate(0, 3.75, 0), gold); kb.add(new THREE.SphereGeometry(0.12, 10, 8).translate(0, 3.98, 0), gold); kb.add(new THREE.ConeGeometry(0.05, 0.3, 6).translate(0, 4.2, 0), gold);
    kb.add(new THREE.PlaneGeometry(0.72, 0.95).translate(0, 1.55, AP + 0.006), lam("pKioskWin", () => ({ map: goodsTex("books") })));
    for (let i = 0; i < 4; i++) kb.add(boxGeo(V(-0.42 + i * 0.21, 1.02, 0.92), V(-0.25 + i * 0.21, 1.06 + (i % 3) * 0.03, 1.3)), lam("pStack" + (i % 3), () => ({ map: paperTex(["LE PETIT HIBOU", "PARIS-ÉCHO", "LE BOULEVARD"][i % 3], "ÉDITION SPÉCIALE") })));
    kb.build(k);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.305, 1.305, 0.3, 8, 1, true).rotateY(P8), mat("pJournaux", () => { const m = new THREE.MeshBasicMaterial({ map: ctex("pJournauxTex", 2048, 96, (g) => { g.fillStyle = "#22432e"; g.fillRect(0, 0, 2048, 96); g.fillStyle = "#f2cf6a"; g.textAlign = "center"; g.textBaseline = "middle"; for (let i = 0; i < 4; i++) fitText(g, "JOURNAUX", 256 + i * 512, 52, 380, 60, SERIF); }) }); signMats.push(m); return m; }));
    band.position.y = 2.62; k.add(band);
    const names: [string, string][] = [["LA VOIX DU MATIN", "LA TOUR ROUILLE!"], ["LE PETIT HIBOU", "SCANDALE"], ["PARIS-ÉCHO", "LA TOUR À VENDRE?"], ["LE BOULEVARD", "ÉDITION DU SOIR"], ["L'AURORE", "300 MÈTRES"]];
    const hang = (a: number, off: number, y: number, i: number) => {
      const [n, h] = names[i % 5], pg = new THREE.Group(); pg.position.set(Math.sin(a) * (AP + 0.03) + Math.cos(a) * off, y, Math.cos(a) * (AP + 0.03) - Math.sin(a) * off); pg.rotation.y = a; k.add(pg);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.36).translate(0, -0.19, 0), lam("pHang" + n, () => ({ map: paperTex(n, h) }))); p.castShadow = true; pg.add(p); papers.push(p);
    };
    for (const f of [-1, 1]) for (let j = 0; j < 3; j++) hang((f * Math.PI) / 4, (j - 1) * 0.27, 2.32, j + (f > 0 ? 2 : 0));
    for (const f of [-2, 2]) for (let j = 0; j < 2; j++) hang((f * Math.PI) / 4, (j - 0.5) * 0.3, 2.32, j + f + 3);
    hang(0, -0.24, 2.36, 0); hang(0, 0.24, 2.36, 2);
    // headline easel board on the sidewalk, facing the street
    const e = new THREE.Group(); e.position.set(-10.45, SW, -4.45); e.rotation.y = 0.62; root.add(e);
    const wood = lam("pBoardWood", () => ({ map: beamHD() }));
    for (const s of [-1, 1]) { e.add(new THREE.Mesh(rodGeo([s * 0.6, 0, 0.12], [s * 0.6, 1.62, -0.08], 0.035, 5), wood)); e.add(new THREE.Mesh(rodGeo([s * 0.55, 0, -0.45], [s * 0.6, 1.5, -0.08], 0.03, 5), wood)); }
    const fr = new THREE.Mesh(boxGeo(V(-0.74, 0.82, -0.04), V(0.74, 1.62, 0.02)), wood); fr.rotation.x = -0.12; fr.castShadow = true; e.add(fr);
    const hl = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.68), unlit("headline", () => ctex("pHeadline", 1024, 512, (g) => {
      g.fillStyle = "#f6eed8"; g.fillRect(0, 0, 1024, 512); g.strokeStyle = "#1e1a20"; g.lineWidth = 10; g.strokeRect(14, 14, 996, 484);
      g.fillStyle = "#1e1a20"; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, "LA VOIX DU MATIN", 512, 82, 760, 62, SERIF); g.fillRect(60, 128, 904, 6);
      g.fillStyle = "#c21e1e"; fitText(g, "LA TOUR", 512, 232, 860, 150, SERIF); fitText(g, "ROUILLE !", 512, 388, 860, 150, SERIF);
    })));
    hl.position.set(0, 1.22, 0.025); hl.rotation.x = -0.12; e.add(hl);
  }
  // ---- MORRIS COLUMN ----
  {
    const m = new THREE.Group(); m.position.set(...MORRIS); m.rotation.y = 0.6; root.add(m); const mb = new Batch(), green = col("#2a4f3a");
    mb.add(new THREE.CylinderGeometry(0.74, 0.8, 0.5, 20).translate(0, 0.25, 0), green);
    mb.add(new THREE.CylinderGeometry(0.62, 0.62, 2.7, 28, 1, true).translate(0, 1.85, 0), lam("pPosters", () => ({ map: posterTex() })));
    mb.add(new THREE.CylinderGeometry(0.7, 0.66, 0.3, 24).translate(0, 3.35, 0), green);
    mb.add(new THREE.CylinderGeometry(0.76, 0.76, 0.12, 24).translate(0, 3.56, 0), shiny("gold", "#e2b24a", 70));
    mb.add(new THREE.SphereGeometry(0.7, 22, 10, 0, TAU, 0, Math.PI / 2).scale(1, 0.95, 1).translate(0, 3.6, 0), lam("pMorrisDome", () => ({ map: roofHD("#3c6a50", true) })));
    mb.add(new THREE.SphereGeometry(0.1, 10, 8).translate(0, 4.32, 0), shiny("gold", "#e2b24a", 70)); mb.add(new THREE.ConeGeometry(0.04, 0.3, 6).translate(0, 4.5, 0), shiny("gold", "#e2b24a", 70));
    mb.build(m);
  }
  // ---- trees, lamps, benches, bicycle ----
  const lampTops: V3[] = [];
  TREES_R.forEach((z, i) => planeTree(b, 9.6, z, i + 1)); TREES_L.forEach((z, i) => planeTree(b, -9.6, z, i + 31));
  LAMPS_R.forEach((z) => lampTops.push(lampPost(b, C.glass, 9.0, z))); LAMPS_L.forEach((z) => lampTops.push(lampPost(b, C.glass, -9.0, z)));
  bench(b, -14.6, -30, Math.PI / 2); bench(b, 14.6, -46, -Math.PI / 2); bench(b, -14.6, 16, Math.PI / 2);
  {
    const bk = new THREE.Group(); bk.position.set(10.05, SW, 15.7); bk.rotation.set(0, 0.04, 0.2); root.add(bk); const kb = new Batch(), fr = col("#1f3a34"), tyre = col("#2a2630"), steel = shiny("steel", "#c8ccd4", 60);
    for (const z of [-0.55, 0.55]) { kb.add(new THREE.TorusGeometry(0.34, 0.025, 6, 24).rotateY(Math.PI / 2).translate(0, 0.36, z), tyre); for (let k = 0; k < 8; k++) kb.add(rodGeo([0, 0.36, z], [0, 0.36 + Math.cos((k / 8) * TAU) * 0.32, z + Math.sin((k / 8) * TAU) * 0.32], 0.004, 3), steel); }
    for (const [a, c] of [[[0, 0.36, -0.55], [0, 0.8, -0.1]], [[0, 0.36, -0.55], [0, 0.42, 0.0]], [[0, 0.42, 0.0], [0, 0.8, -0.1]], [[0, 0.8, -0.1], [0, 0.82, 0.42]], [[0, 0.42, 0.0], [0, 0.82, 0.42]], [[0, 0.36, 0.55], [0, 0.95, 0.45]]] as [V3, V3][]) kb.add(rodGeo(a, c, 0.018, 5), fr);
    kb.add(rodGeo([-0.25, 0.97, 0.43], [0.25, 0.97, 0.43], 0.014, 5), steel); kb.add(new THREE.BoxGeometry(0.14, 0.05, 0.24).translate(0, 0.86, -0.12), col("#3a2418"));
    kb.add(boxGeo(V(-0.15, 0.72, 0.5), V(0.15, 0.92, 0.78)), lam("pBasket", () => ({ map: weaveTex("#b98a4a") })));
    for (let k = 0; k < 3; k++) kb.add(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 8).rotateX(0.3 + k * 0.1).translate(-0.06 + k * 0.06, 1.05, 0.62), col("#d99a4a"));
    kb.build(bk);
  }
  // ---- parked extras (reuse the limo) ----
  const parked: Limo[] = [limo(root, [-7.2, 0, -40], Math.PI, "#1f1d27"), limo(root, [-7.2, 0, -70], Math.PI, "#2f5a3e")];
  // ---- the hero LIMOUSINE ----
  const car = limo(root, [LANE, 0, CAR_Z0], Math.PI, "#6b1d2a");
  const stopPath = new THREE.CatmullRomCurve3([V(LANE, 0, 30), V(LANE, 0, 14), V(5.6, 0, 3), V(7.0, 0, -1.5), V(PARK[0], 0, PARK[2])]), stopLen = stopPath.getLength();
  // ---- cross avenue: overhead tram wire + the tram ----
  b.add(rodGeo([-120, 6.6, -140], [120, 6.6, -140], 0.03, 4), ironM());
  for (const x of [-60, -30, 30, 60]) b.add(rodGeo([x, 0, -124.5], [x, 7.2, -124.5], 0.09, 6), ironM());
  const tram = new THREE.Group(); tram.position.set(0, 0, -140); root.add(tram);
  { const tb = new Batch(); tb.add(boxGeo(V(-5, 0.45, -1.2), V(5, 3.0, 1.2)), lam("pTramM", () => ({ map: tramTex() }))); tb.add(boxGeo(V(-5.2, 3.0, -1.3), V(5.2, 3.2, 1.3)), col("#5a3a2a")); tb.add(boxGeo(V(-3, 3.2, -0.8), V(3, 3.5, 0.8)), col("#efe4c8")); tb.add(boxGeo(V(-4.8, 0.1, -1.0), V(4.8, 0.45, 1.0)), col("#2a2630")); tb.add(rodGeo([1.5, 3.5, 0], [-1.2, 6.6, 0], 0.035, 4), ironM()); tb.build(tram); }
  // ---- the Eiffel Tower + Champ de Mars trees ----
  const tw = tower(root, TOWER, TOWER_S);
  const leafFar = lam("pLeafFar", () => ({ color: "#6a9a52" }));
  for (const s of [-1, 1]) for (let zz = -262; zz > -385; zz -= 12) for (const xx of [16, 24]) b.add(new THREE.IcosahedronGeometry(4.2, 1).scale(1, 1.2, 1).translate(s * xx, 6, zz), leafFar);
  // ---- build static batches ----
  b.build(root); C.glass.build(root); C.rails.build(root);
  const litG = new THREE.Group(); root.add(litG); C.lit.build(litG, false); litG.traverse((o) => o.layers.set(NOINK));
  // ---- lights (point lights only near the playable spots; switched by dusk) ----
  const near = (p: V3) => [[9.0, 12], [-9.0, 14], [-9.0, -7], [9.0, -18], [-9.0, 38]].some(([x, z]) => Math.abs(p[0] - x) < 0.1 && Math.abs(p[2] - z) < 0.1);
  const lampGlows = lampTops.map((p) => glow(root, p, "#ffcf80", 1.8, 1));
  const lampLights = lampTops.filter(near).map((p) => { const l = new THREE.PointLight("#ffbe6a", 0, 14, 1.4); l.position.set(p[0], p[1] - 0.3, p[2]); root.add(l); return l; });
  const polGlow = glow(root, policeLampPos!, "#ffd9a0", 0.01, 0), polL = new THREE.PointLight("#ffc890", 0, 9, 1.4); polL.position.set(...policeLampPos!); root.add(polL);
  const wallGlows = policeWallLamps!.map((p) => glow(root, p, "#7fb2ff", 1.6, 1)), wallL = policeWallLamps!.map((p) => { const l = new THREE.PointLight("#8ab4ff", 0, 7, 1.4); l.position.set(...p); root.add(l); return l; });
  const cafeL = new THREE.PointLight("#ffc27a", 0, 10, 1.4); cafeL.position.set(14.2, 2.6, 1.5); root.add(cafeL);
  const cafeGlow = glow(root, [15.6, 2.0, 1.5], "#ffcf8a", 6, 0.5);
  // ---- ambient life: pigeons (ground + flock), smoke, falling leaves ----
  const pigeons = ([[-9.9, -6.2, 0], [-9.5, -5.3, 2], [-10.3, 0.6, 4], [10.0, -7.6, 1], [9.7, 9.8, 3], [-2.5, 9.0, 5], [-3.2, 10.1, 6], [10.2, -9.0, 7]] as V3[]).map(([x, z, s]) => {
    const g = new THREE.Group(); root.add(g); const y = x > -8.4 && x < 8.4 ? 0 : SW;
    const grey = col("#8e94a8"), dark = col("#5c6276"), neck = shiny("pigeonNeck", "#5f8f7a", 80), beak = col("#3a3438");
    const bd = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8).scale(0.8, 0.72, 1.35), grey); bd.position.y = 0.11; g.add(bd);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.14), dark); tail.position.set(0, 0.12, -0.17); tail.rotation.x = -0.3; g.add(tail);
    for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6).scale(0.4, 0.6, 1.5), dark); w.position.set(sx * 0.075, 0.13, -0.03); g.add(w); }
    const head = new THREE.Group(); head.position.set(0, 0.17, 0.1); g.add(head);
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), dark)); const nk = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.018, 6, 12).rotateX(Math.PI / 2), neck); nk.position.y = -0.04; head.add(nk);
    const bk = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.05, 6).rotateX(Math.PI / 2), beak); bk.position.set(0, -0.005, 0.06); head.add(bk);
    for (const sx of [-1, 1]) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 4), col("#c86a6a")); lg.position.set(sx * 0.03, 0.03, 0); g.add(lg); }
    g.traverse((o) => { (o as THREE.Mesh).castShadow = true; });
    return { g, head, home: [x, y, z] as V3, s };
  });
  const flock = birds(root, 6, [0, 17, -6], 12, "#a4a9bb", 0.75);
  const smoke = C.smoke.filter((p) => p[2] > -130).slice(0, 18).map((p) => Array.from({ length: 4 }, () => { const m = mist(root, p, 1.4, "#eceaf2", 0.5); m.userData = { p }; return m; }));
  const leafM = mat("pLeafFall", () => twoTone(new THREE.MeshLambertMaterial({ map: leafCut(), alphaTest: 0.5, side: THREE.DoubleSide })));
  const LEAF_TREES: V3[] = [[9.6, 0, 17], [9.6, 0, -10], [-9.6, 0, 8], [-9.6, 0, -14], [-9.6, 0, 21], [9.6, 0, 30]];
  const leaves = Array.from({ length: 22 }, (_, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18), leafM); m.layers.set(NOINK); root.add(m); const r = rng(i * 7 + 3); return { m, t: LEAF_TREES[i % LEAF_TREES.length], ox: (r() - 0.5) * 4, oz: (r() - 0.5) * 4, per: 7 + r() * 5, ph: r() * 20 }; });
  // ---- marks + cams ----
  const S = SW;
  const marks: Record<string, V3> = {
    newsboy: [-10.35, S, -2.4], headline: [-10.55, S, -4.55], kiosk: KIOSK,
    lustigTable: [12.0, S, 1.0], lustigStand: [11.0, S, 0.25], waiterStart: [15.3, S, -1.5], waiterEnd: [12.6, S, 1.45], cafeDoor: [15.4, S, -1.5],
    stroll1: [-12.4, S, 14], stroll2: [-11.0, S, -11], stroll3: [-13.2, S, -33], stroll4: [11.6, S, 21], stroll5: [13.0, S, -14], stroll6: [11.2, S, -29], stroll7: [-11.8, S, -57], stroll8: [12.4, S, -60],
    coupleA: [-11.9, S, 2.6], coupleB: [-11.2, S, 3.3],
    policeBottom: [-12.8, S, 33.5], policeTop: [-15.3, S + 0.68, 33.5], gendarme: [-15.35, S + 0.68, 31.9], gendarmeBox: [-15.0, S, 29.4],
    carPark: PARK, carLaneStart: [LANE, 0, CAR_Z0], carLaneEnd: [LANE, 0, CAR_Z1], tower: TOWER, morris: MORRIS,
  };
  const cams = {
    crane: { pos: [-2.5, 17.5, 66] as V3, look: [0.4, 11.2, -40] as V3, fov: 40 },
    cafe: { pos: [5.0, 1.75, 2.8] as V3, look: [12.4, 1.45, 0.6] as V3, fov: 38 },
    kiosk: { pos: [-7.0, 0.5, 4.8] as V3, look: [-11.4, 2.5, -5.2] as V3, fov: 40 },
    track: streetTrack(0.37), trackFront: streetTrack(0.37, "front"),
    police: { pos: [-1.2, 1.75, 30.8] as V3, look: [-14.8, 2.45, 33.3] as V3, fov: 38 },
    boulevard: { pos: [1.2, 1.7, 22] as V3, look: [0, 9, -100] as V3, fov: 42 },
  };
  const swing = root.userData.cafeSwing as THREE.Group[];
  return {
    name: "street", root, marks, cams,
    pose: (t, c) => {
      const dusk = c.lamps ?? (TONE.uLitCol.value.y < 1.1 ? 1 : 0);
      // car
      if ((c.carStop ?? 0) > 0) {
        const u = cl(c.carStop!), e = 1 - (1 - u) * (1 - u), p = stopPath.getPointAt(e), tg = stopPath.getTangentAt(e);
        car.g.position.set(p.x, 0, p.z); car.g.rotation.y = Math.atan2(tg.x, tg.z); car.set(e * stopLen, t, { bob: u < 0.99 ? 1 : 0.18, lights: dusk });
      } else {
        const u = c.car ?? 0, z = streetCarZ(u);
        car.g.position.set(LANE, 0, z); car.g.rotation.y = Math.PI; car.set(u * (CAR_Z0 - CAR_Z1), t, { bob: u > 0.001 && u < 0.999 ? 1 : 0.18, lights: dusk });
      }
      parked.forEach((p) => p.set(0, t, { bob: 0, lights: 0 }));
      // awnings, flag, newspapers, swinging signs
      C.hems.forEach((h) => { const p = h.m.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) { const x = p.getX(i), lo = p.getY(i) < -0.1; p.setZ(i, lo ? h.amp * Math.sin(t * 3.4 + x * 1.7 + h.ph) : 0); } p.needsUpdate = true; h.m.rotation.x = 0.06 * Math.sin(t * 1.3 + h.ph); });
      { const p = policeFlag.geometry.attributes.position as THREE.BufferAttribute, base = policeFlag.userData.base ?? (policeFlag.userData.base = Float32Array.from(p.array as Float32Array)); for (let i = 0; i < p.count; i++) { const bx = base[i * 3], by = base[i * 3 + 1], k = cl((2.35 - by) / 1.2); p.setXYZ(i, bx, by, base[i * 3 + 2] + Math.sin(t * 5 - (2.35 - by) * 4) * 0.09 * k); } p.needsUpdate = true; policeFlag.geometry.computeVertexNormals(); }
      papers.forEach((m, i) => { m.rotation.x = 0.1 * Math.sin(t * 2.2 + i * 1.3); m.rotation.z = 0.04 * Math.sin(t * 1.7 + i); });
      swing[0].rotation.z = 0.16 * Math.sin(t * 2.1 + 0.5); swing[1].rotation.z = 0.12 * Math.sin(t * 1.4);
      // tram + flock + pigeons
      tram.position.x = -95 + ((t * 4.2) % 190);
      flock(t);
      pigeons.forEach((pg, i) => {
        const s = pg.s, ph = (t * 0.55 + s * 0.37) % 1, step = Math.floor(t * 0.55 + s * 0.37), hop = ph < 0.18 ? Math.sin((ph / 0.18) * Math.PI) : 0;
        const a = s * 1.9 + step * 0.8 + (ph < 0.18 ? (ph / 0.18) * 0.8 : 0.8), rr = 0.45;
        pg.g.position.set(pg.home[0] + Math.cos(a) * rr, pg.home[1] + hop * 0.07, pg.home[2] + Math.sin(a) * rr); pg.g.rotation.y = -a;
        pg.head.rotation.x = ph >= 0.18 ? 0.75 * Math.max(0, Math.sin((ph - 0.18) * TAU * 2.4 + i)) : -0.1;
      });
      // smoke drifting with a light breeze (+x)
      smoke.forEach((ms, j) => ms.forEach((m, i) => { const u = (t * 0.1 + i / ms.length + j * 0.13) % 1, p = m.userData.p as V3; m.position.set(p[0] + u * 2.2 + Math.sin(t + i) * 0.2, p[1] + u * 4.5, p[2] - u * 0.6); (m.material as THREE.SpriteMaterial).opacity = 0.5 * Math.sin(Math.PI * u); const sc = 1.0 + u * 2.6; m.scale.set(sc, sc * 0.75, 1); }));
      leaves.forEach((l, i) => {
        const u = ((t + l.ph) / l.per) % 1, f = cl(u / 0.85), [tx, , tz] = l.t;
        const y = Math.max(SW + 0.01, 8.2 - f * 8.3), sway = Math.sin(f * TAU * 2.2 + l.ph) * 0.7;
        l.m.position.set(tx + l.ox * 0.5 + sway + f * 1.2, y, tz + l.oz * 0.5 + Math.cos(f * TAU * 1.7 + l.ph) * 0.4);
        l.m.rotation.set(u < 0.85 ? t * 2.3 + i : -Math.PI / 2, u < 0.85 ? Math.sin(t * 1.9 + i) : i, u < 0.85 ? Math.sin(t * 2.7 + i) * 1.3 : 0);
      });
      // dusk: lamps, lit windows, signs, café glow, tower beacon
      litG.visible = dusk > 0.01;
      lampGlass().color.set(dusk > 0.5 ? "#ffd08a" : "#dfe4e0").multiplyScalar(dusk > 0.5 ? 2.4 : 1);
      lampGlows.forEach((g, i) => { (g.material as THREE.SpriteMaterial).opacity = dusk * (0.85 + 0.15 * Math.sin(t * 7 + i)); });
      lampLights.forEach((l, i) => { l.intensity = dusk * 7 * (0.94 + 0.06 * Math.sin(t * 9 + i)); });
      (polGlow.material as THREE.SpriteMaterial).opacity = 0; polL.intensity = dusk * 3;
      wallGlows.forEach((g) => ((g.material as THREE.SpriteMaterial).opacity = 0.12 + dusk * 0.88)); wallL.forEach((l) => (l.intensity = dusk * 5));
      cafeL.intensity = 1.5 + dusk * 5; (cafeGlow.material as THREE.SpriteMaterial).opacity = 0.35 + dusk * 0.5;
      signMats.forEach((m) => m.color.setScalar(dusk > 0.5 ? 0.62 : 1));
      (tw.beacon.material as THREE.SpriteMaterial).opacity = dusk * (0.6 + 0.4 * Math.sin(t * 2));
    },
  };
};
