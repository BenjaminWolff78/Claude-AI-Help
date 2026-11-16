// "He Made Giant Bricks to Pay Half the Tax": the village (scene 2 noon street, scene 4 Ned's building plot in spring,
// scene 9 the lane at sunset with the taxman's new house). Local metres, ground y = 0.
// The high street runs along x (dirt road |z| < 3.2, cobbled pavements to |z| 4.4). North-side houses face +z (front at
// z = -4.4), south-side houses face -z (front at z = 4.4). The bakery is on the north side at x 1.6..6.4 (bay window of
// bread, hanging loaf sign, a stall out front). Ned's plot is a gap on the north side at x 13.5..20.5: a cottage going up
// in Amos's loaves (control wallH), a plank on trestles with his steaming mug of tea. West of the street (x < -12) it turns
// into Church Lane: the old cottage of normal bricks at x -26..-21 and the taxman's new house of loaves at x -20..-13.6
// (both on the north side, low garden walls, picket gates). The church closes the east end (x 40).
// Controls: cart 0..1 (Amos's handcart rolls east along the street, x -10 -> 10), wallH 0..1 (Ned's wall rises, 0..12
// courses), tea 0..1 (steam off the mug), laugh 0/1 (villagers' doors and windows open), spring 0/1 (window-box flowers),
// stick 0/1 (the taxman's new 3-inch measuring stick hangs by his door).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, V, lam, quad, house } from "../build";
import { ctex, rng, rep, beamHD, planksHD, roofHD, facadeHD, stoneHD, cobbleHD } from "../paint";
import { NOINK } from "../ink";
import { mist, barrel, sack, glow, lamp, crate } from "../setkit";
import { swayMaterial } from "../sway";
import { clayGroundTex, clayGroundBump, brickFaceTex, brickBumpTex, leafCut, barkTex, blossomTex, leafyTree, handcart, labelTex, leafSolid, blossomSolid, smoothIco, leafCardMat, leafFringe } from "./brickyard";
import type { SetDef, V3 } from "./types";

const TAU = Math.PI * 2;
const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
const blot = (g: CanvasRenderingContext2D, x: number, y: number, rad: number, rgba: string) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba); gr.addColorStop(1, rgba.replace(/[\d.]+\)$/, "0)")); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
const cache = new Map<string, THREE.Material>();
const mat = <T extends THREE.Material>(key: string, make: () => T): T => { let m = cache.get(key) as T | undefined; if (!m) { m = make(); cache.set(key, m); } return m; };
const bx = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const BRL = 0.3; // brick length (1.6 x real)
/* r68: the new house's roof: the tile base plus odd darker and lighter tiles, soot runs, moss along the courses and lichen spots */
const roofWeathered = (col: string) => ctex("vbRoofW2" + col, 1024, 1024, (g, r) => {
  g.drawImage((roofHD(col).image as unknown) as CanvasImageSource, 0, 0);
  g.fillStyle = "rgba(70,40,34,0.22)"; g.fillRect(0, 0, 1024, 1024);
  const TW = 77, C = 64;
  for (let i = 0; i < 260; i++) { const row = Math.floor(r() * 16), off = (row % 2) * TW / 2, x = Math.floor(r() * 14) * TW - off, y = row * C, t = r();
    g.fillStyle = t < 0.55 ? `rgba(48,24,20,${0.18 + r() * 0.2})` : t < 0.85 ? `rgba(255,214,180,${0.08 + r() * 0.12})` : `rgba(96,92,70,${0.2 + r() * 0.15})`; g.fillRect(x + 2, y, TW - 2, C - 5); }
  for (let i = 0; i < 70; i++) { const x = r() * 1024, y = r() * 1024, w = 6 + r() * 16, hh = 60 + r() * 220; const gr = g.createLinearGradient(0, y, 0, y + hh); gr.addColorStop(0, "rgba(30,20,18,0.28)"); gr.addColorStop(1, "rgba(30,20,18,0)"); g.fillStyle = gr; g.fillRect(x, y, w, hh); }
  for (let i = 0; i < 900; i++) { const row = Math.floor(r() * 16), y = row * C + C - 8 - r() * 10, x = r() * 1024; g.fillStyle = `rgba(${84 + r() * 30},${96 + r() * 30},${52 + r() * 20},${0.25 + r() * 0.3})`; g.beginPath(); g.ellipse(x, y, 3 + r() * 9, 2 + r() * 4, 0, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(214,200,130,${0.3 + r() * 0.35})`; g.beginPath(); g.arc(r() * 1024, r() * 1024, 1.5 + r() * 3.5, 0, Math.PI * 2); g.fill(); }
});
const FL = 0.3;   /* r38: the yard loaf's own length (the facade loaves read smaller than the garden-wall loaves) */ const FL_OLD = 0.24; void FL_OLD;   /* r24: the facade maps ~1.2x wide on screen: 0.24 x 0.21 loaves read as chunky blocks, the cottage's 0.24 x 0.105 as ordinary bricks */ //  // r20: brick length on the two lane house fronts (normal 0.36 x 0.105 = 3.4:1 like a real brick, loaf 0.36 x 0.21 = 1.7:1 - a chunky loaf)

/** a brick front with windows and a door, for the two lane houses. courseM: 0.115 (normal) or 0.215 (Amos's loaves).
 *  Same brick LENGTH in both, so the doubled course height reads at a glance side by side. Window and door rectangles
 *  are painted in metres from the bottom-left. */
const brickFront = (key: string, wm: number, hm: number, courseM: number, o: { wins: [number, number, number, number][]; door: [number, number, number, number]; doorCol: string; plaque?: string; date?: string; lit?: number[]; flat?: boolean }) => {
  const PX = Math.min(150, 2048 / Math.max(wm, hm)), W = Math.round(wm * PX), H = Math.round(hm * PX), m = (v: number) => v * PX;
  return ctex("vbFront3" + key + (o.flat ? "F2" : ""), W, H, (g, r) => {
    g.fillStyle = courseM > 0.15 ? "#93704f" : "#b4a48a";   /* r60: warm sand-lime (in shade the grey joints read blue-grey) */ g.fillRect(0, 0, W, H);   /* r57: darker, recessed-looking mortar (a pale grid read as tiles) */   /* r26: a duller mortar (the bright grid read as wallpaper) */
    const bw = m(FL), ch = m(courseM), mo = Math.max(3, m(0.022)), pal = courseM > 0.15 ? ["#9a5d45", "#8f5740", "#a2674b", "#82513b", "#955b43", "#a66949", "#7a4b35", "#9b654c", "#6e4236", "#b48466", "#8a4a3a", "#a87458"]   /* r69: wider spread - darker plum-brown and pale buff loaves (the front read as one orange tile) */ : ["#8a4e44", "#7e4840", "#94564a", "#744238", "#8c5246", "#7a463e"];   /* r25: the new house wears the yard's fired-loaf colours, the old cottage an older, darker brick */   // r12: the new loaves are less saturated, wider in value
    if (o.flat) { g.fillStyle = "#8a857a"; g.fillRect(0, 0, W, H); for (let i = 0; i < 2400; i++) { g.fillStyle = r() < 0.5 ? "rgba(60,54,46,0.3)" : "rgba(214,208,194,0.3)"; g.fillRect(r() * W, r() * H, 2, 2); } }   /* r70: behind the 3D loaves only recessed mortar shows */
    if (!o.flat) for (let y = H, row = 0; y > -ch; y -= ch, row++) for (let x = -(row % 2) * bw / 2; x < W; x += bw) {
      g.fillStyle = pal[Math.floor(r() * pal.length)]; g.fillRect(x + mo / 2, y - ch + mo / 2, bw - mo, ch - mo);
      { const v = r(); g.fillStyle = v < 0.5 ? `rgba(30,12,6,${(0.22 * (0.5 - v)).toFixed(3)})` : `rgba(255,228,196,${(0.16 * (v - 0.5)).toFixed(3)})`; g.fillRect(x + mo / 2, y - ch + mo / 2, bw - mo, ch - mo); if (r() < 0.06) { g.fillStyle = "rgba(40,20,14,0.28)"; g.fillRect(x + mo / 2, y - ch + mo / 2, bw - mo, ch - mo); } }   /* r26b: per-brick value jitter and a few burnt ones (the wall read as one repeating tile) */
      for (let k = 0; k < 7; k++) { g.fillStyle = r() < 0.5 ? "rgba(60,26,16,0.22)" : "rgba(255,220,186,0.18)"; g.fillRect(x + mo / 2 + r() * (bw - mo - 3), y - ch + mo / 2 + r() * (ch - mo - 3), 2 + r() * 3, 2 + r() * 2); }   // r12: sand speckle per brick
      g.fillStyle = "rgba(255,226,190,0.2)"; g.fillRect(x + mo / 2, y - ch + mo / 2, bw - mo, Math.max(2, ch * 0.08));
      if (courseM > 0.15 && r() > 0.72) {   /* r59: ~28 % */   /* r55: ~40 % stamped (the A grid read as a repeated tile) */   /* r51: ~58 % stamped, each with its own size and depth (the front read as a repeated decal) */   /* r44: stamps on ~70 % (the house of loaves did not read at a distance) */   /* r26j: the stamp on some loaves only (every brick stamped read as wallpaper) */ const al = 0.3 + r() * 0.45,   /* r35: deeper-pressed stamps (the payoff wall needed squinting) */ ox = (r() - 0.5) * bw * 0.12, oy = (r() - 0.5) * ch * 0.1; g.save(); g.translate(x + bw / 2 + ox, y - ch / 2 + 1 + oy); g.rotate((r() - 0.5) * 0.12);
        g.font = `900 ${Math.round(ch * (0.34 + r() * 0.16))}px Georgia, serif`;   /* r61: smaller stamps (reviewer: oversized A's on the facade) */ g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = `rgba(255,220,188,${(al * 0.62).toFixed(2)})`; g.fillText("A", 0, 1.8); g.fillStyle = `rgba(70,26,14,${al.toFixed(2)})`; g.fillText("A", 0, 0); g.restore(); }   /* r26: pressed stamps that vary (depth, angle, a few missing): one tile read as wallpaper */   /* r25: every loaf carries Amos's A, as in the yard */
      g.fillStyle = "rgba(60,22,12,0.22)"; g.fillRect(x + mo / 2, y - mo / 2 - Math.max(2, ch * 0.08), bw - mo, Math.max(2, ch * 0.08));
    }
    if (courseM < 0.15) { for (let i = 0; i < 30; i++) blot(g, r() * W, r() * H, m(0.3 + r() * 0.9), "rgba(50,34,26,0.16)"); for (let i = 0; i < 40; i++) blot(g, r() * W, H - r() * m(0.7), m(0.12 + r() * 0.35), "rgba(70,96,46,0.32)"); for (const wx of o.wins) for (let k = 0; k < 3; k++) { const gx = m(wx[0] + 0.1 + r() * (wx[2] - 0.2)), gy = H - m(wx[1]); const gr2 = g.createLinearGradient(0, gy, 0, gy + m(0.9)); gr2.addColorStop(0, "rgba(40,28,22,0.3)"); gr2.addColorStop(1, "rgba(40,28,22,0)"); g.fillStyle = gr2; g.fillRect(gx, gy, m(0.05 + r() * 0.08), m(0.9)); } }   // old cottage: soot, moss at the foot, streaks under the sills (r26d: it read as new as the taxman's house)
    else { for (let i = 0; i < 10; i++) blot(g, r() * W, r() * H, m(0.25 + r() * 0.6), "rgba(70,50,40,0.08)"); for (const wx of o.wins) { const gr = g.createLinearGradient(0, H - m(wx[1]), 0, H - m(wx[1]) + m(0.9)); gr.addColorStop(0, "rgba(60,40,34,0.18)"); gr.addColorStop(1, "rgba(60,40,34,0)"); g.fillStyle = gr; g.fillRect(m(wx[0]) - m(0.05), H - m(wx[1]), m(wx[2]) + m(0.1), m(0.9)); } }   // r12: light grime + rain streaks under the sills
    { const gr = g.createLinearGradient(0, H - m(1.2), 0, H); gr.addColorStop(0, "rgba(60,40,30,0)"); gr.addColorStop(1, "rgba(60,40,30,0.3)"); g.fillStyle = gr; g.fillRect(0, H - m(1.2), W, m(1.2)); }
    for (let i = 0; i < 20; i++) blot(g, r() * W, H - r() * m(0.25), m(0.15 + r() * 0.25), "rgba(80,110,50,0.3)");
    for (let i = 0; i < 40; i++) blot(g, r() * W, r() * H, m(0.08 + r() * 0.12), r() < 0.5 ? "rgba(255,210,170,0.16)" : "rgba(70,24,14,0.16)");
    const rect = (x: number, y: number, w: number, h: number) => [m(x), H - m(y + h), m(w), m(h)] as const;
    for (const [wi, [x, y, w, h]] of o.wins.entries()) {
      const [X, Y, Wd, Hd] = rect(x, y, w, h);
      g.fillStyle = "#efe6d2"; g.fillRect(X - m(0.08), Y - m(0.1), Wd + m(0.16), Hd + m(0.2));             // stone surround
      g.fillStyle = o.lit?.includes(wi) ? "#ffb860" : "#4a3c44"; g.fillRect(X, Y, Wd, Hd);
      // r17: the glass reflects a warm sky at the top fading to blue-grey (it read mauve at sunset)
      const gr = g.createLinearGradient(X, Y, X, Y + Hd); gr.addColorStop(0, "rgba(255,176,120,0.5)"); gr.addColorStop(0.45, "rgba(214,140,120,0.24)"); gr.addColorStop(1, "rgba(64,48,58,0.3)");   /* r74: the panes reflect the sunset sky (reviewers: a noon-blue reflection) */ g.fillStyle = gr; g.fillRect(X, Y, Wd, Hd);
      g.strokeStyle = "#f6f1e6"; g.lineWidth = m(0.05); g.strokeRect(X, Y, Wd, Hd);
      g.lineWidth = m(0.03); for (let k = 1; k < 3; k++) { g.beginPath(); g.moveTo(X + (Wd * k) / 3, Y); g.lineTo(X + (Wd * k) / 3, Y + Hd); g.stroke(); } for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(X, Y + (Hd * k) / 4); g.lineTo(X + Wd, Y + (Hd * k) / 4); g.stroke(); }
      g.fillStyle = "#efe6d2"; g.fillRect(X - m(0.12), Y + Hd, Wd + m(0.24), m(0.09));                    // sill
    }
    { const [X, Y, Wd, Hd] = rect(...o.door); g.fillStyle = "#efe6d2"; g.fillRect(X - m(0.1), Y - m(0.12), Wd + m(0.2), Hd + m(0.12));
      g.fillStyle = o.doorCol; g.fillRect(X, Y, Wd, Hd); g.strokeStyle = "rgba(0,0,0,0.3)"; g.lineWidth = m(0.03);
      for (const [a, b] of [[0.12, 0.08], [0.12, 0.55]]) { g.strokeRect(X + Wd * a, Y + Hd * b, Wd * 0.32, Hd * 0.36); g.strokeRect(X + Wd * (1 - a - 0.32), Y + Hd * b, Wd * 0.32, Hd * 0.36); }
      g.fillStyle = "#e8c050"; g.beginPath(); g.arc(X + Wd * 0.8, Y + Hd * 0.52, m(0.04), 0, TAU); g.fill();
      if (o.plaque) { const px = X + Wd * 0.06, py = Y + Hd * 0.36, pw = Wd * 0.88, ph = Hd * 0.14,   /* r76i (reviewers): a plate across the door (at 9 % of the frame TAX MAN could not be read) */ pg = g.createLinearGradient(0, py, 0, py + ph); pg.addColorStop(0, "#f0d27a"); pg.addColorStop(0.45, "#c89a40"); pg.addColorStop(1, "#8a6424"); g.fillStyle = "#4a3410"; g.fillRect(px - 3, py - 3, pw + 6, ph + 6); g.fillStyle = pg; g.fillRect(px, py, pw, ph); g.fillStyle = "rgba(255,246,210,0.55)"; g.fillRect(px + 3, py + 2, pw - 6, Math.max(1, ph * 0.08)); g.fillStyle = "#5a4216"; for (const [sx, sy] of [[px + ph * 0.25, py + ph * 0.5], [px + pw - ph * 0.25, py + ph * 0.5]]) { g.beginPath(); g.arc(sx, sy, ph * 0.09, 0, Math.PI * 2); g.fill(); }   /* r60: a brass plate (bevel, sheen, screws), not a yellow sticker */ g.fillStyle = "#3a2a10"; g.font = `900 ${Math.round(Hd * 0.06)}px Georgia, serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(o.plaque, X + Wd / 2, Y + Hd * 0.468, Wd * 0.6 * 0.84);   /* r70: squeezed inside the plate (its last letter was clipped) */ } }
    if (o.date) { const [X, Y, Wd, Hd] = rect(wm / 2 - 0.45, hm - 0.75, 0.9, 0.42); g.fillStyle = "#efe6d2"; g.fillRect(X, Y, Wd, Hd); g.fillStyle = "#4a3a2a"; g.font = `900 ${Math.round(Hd * 0.62)}px Georgia, serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(o.date, X + Wd / 2, Y + Hd / 2 + 2); }
  });
};
const roadTex = () => clayGroundTex("vbRoad2", "#8c7a5e");   // r21: a darker packed-earth road (the noon road washed out to flat beige)
const shopSignTex = () => ctex("vbBakerSign", 512, 384, (g) => {
  g.fillStyle = "#2f4a3a"; g.fillRect(0, 0, 512, 384); g.strokeStyle = "#e8c050"; g.lineWidth = 14; g.strokeRect(10, 10, 492, 364);
  // a painted cottage loaf
  g.fillStyle = "#c98a3e"; g.beginPath(); g.ellipse(256, 210, 150, 80, 0, 0, TAU); g.fill(); g.fillStyle = "#e2a85a"; g.beginPath(); g.ellipse(240, 190, 110, 50, -0.1, 0, TAU); g.fill();
  g.strokeStyle = "#8a5420"; g.lineWidth = 7; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(256 + i * 52 - 20, 160); g.lineTo(256 + i * 52 + 20, 250); g.stroke(); }
  g.fillStyle = "#f6e2a8"; g.font = "900 72px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("BAKER", 256, 334);
});
const loafBreadTex = () => ctex("vbBread", 256, 256, (g, r) => { g.fillStyle = "#c27a34"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 60; i++) blot(g, r() * 256, r() * 256, 10 + r() * 40, r() < 0.5 ? "rgba(236,176,96,0.5)" : "rgba(120,62,20,0.35)"); for (let i = 0; i < 300; i++) { g.fillStyle = "rgba(255,240,210,0.5)"; g.fillRect(r() * 256, r() * 256, 2, 2); } });
const flowerTex = () => ctex("vbFlowers", 256, 128, (g, r) => { g.clearRect(0, 0, 256, 128); for (let i = 0; i < 160; i++) { const x = r() * 256, y = 20 + r() * 100; g.fillStyle = r() < 0.4 ? "#3e7a34" : ["#e8484a", "#f4c040", "#f2f0ea", "#d86ab0"][Math.floor(r() * 4)]; g.beginPath(); g.arc(x, y, 4 + r() * 6, 0, TAU); g.fill(); } });
const stickTex = () => ctex("vbStick", 64, 512, (g) => { g.fillStyle = "#e8d098"; g.fillRect(0, 0, 64, 512); g.fillStyle = "#c8282a"; g.fillRect(0, 0, 64, 170); g.strokeStyle = "#2a1a10"; g.lineWidth = 4; for (let i = 0; i <= 12; i++) { const y = i * 512 / 12; g.beginPath(); g.moveTo(0, y); g.lineTo(i % 4 === 0 ? 48 : 26, y); g.stroke(); } g.save(); g.translate(40, 300); g.rotate(-Math.PI / 2); g.fillStyle = "#2a1a10"; g.font = "900 40px Georgia, serif"; g.textAlign = "center"; g.fillText("3 IN", 0, 10); g.restore(); });

export const VIL = {
  ROAD_Z: 3.2, FRONT_N: -4.4, FRONT_S: 4.4,
  BAKERY: [4, 0, -4.4] as V3,
  PLOT: [17, 0, -6.2] as V3,          // Ned's wall: runs along x from 14.6 to 19.4 at z -6.2, front face +z
  MUG: [19.6, 0.9, -5.86] as V3,   /* r76i: toward the right edge */   /* r76h: further back beside Ned, the stool whole in frame and nearly in his focus plane (it cut in from the corner, soft) */   /* r76e: nearer the lens, bigger in the medium */   /* r76: right of Ned, inside the site medium (reviewers: no tea on "his tea's still hot" set-up) */     // r12: midground left of Ned (was a foreground plank across the frame)      // Ned's tea mug on the plank by the wall's end
  COTTAGE: [-23.0, 0, -7.2] as V3,    // the old cottage (front face at z -4.9), wall to wall with the taxman's house
  TAXHOUSE: [-16.8, 0, -7.4] as V3,   // the taxman's new house (front face at z -4.9)
  TAXDOOR: [-16.8, 0, -4.5] as V3,
};

export const village = (): SetDef => {
  const root = new THREE.Group(), b = new Batch();
  // r20: the village's loaves and bricks share the brickyard's bump map (they read as smooth plastic boxes)
  const bumpT = brickBumpTex();
  const fired = lam("vbTBfired", () => ({ map: brickFaceTex("fired", true), bumpMap: bumpT, bumpScale: 2.2 } as THREE.MeshLambertMaterialParameters));
  const firedV = [0, 1, 2, 3].map((k) => lam("vbTBfired" + k, () => ({ map: brickFaceTex("fired" + k, true), bumpMap: bumpT, bumpScale: 2.2 } as THREE.MeshLambertMaterialParameters)));
  /* r26: Amos's loaves carry the stamped A wherever they are built in (Ned's wall, the taxman's garden wall); the cottage wall is older, darker brick */
  const firedNA = [0, 1, 2, 3].map((k) => lam("vbTBfiredNA" + k, () => ({ map: brickFaceTex("firedB" + k, true), bumpMap: bumpT, bumpScale: 2.2 } as THREE.MeshLambertMaterialParameters)));
  const firedA = [0, 1, 2, 3].map((k) => lam("vbTBfiredA" + k, () => ({ map: brickFaceTex("firedA" + k, true, "A"), bumpMap: bumpT, bumpScale: 2.2 } as THREE.MeshLambertMaterialParameters)));
  /* r76: garden-wall loaves a shade darker and varied per loaf, like the taxman front (plain fired loaves clipped in the sunset insert) */ const GWT: [number, number, number][] = [[0.52, 0.47, 0.44], [0.44, 0.39, 0.37], [0.58, 0.52, 0.48], [0.48, 0.43, 0.4]];
  /* r76: weathered loaf faces for the garden wall - fire-flashed ends, mottling, creases, pits, lime smears (the insert's loaves read as flat orange plastic) */
  const gwFace = (k: number, A: boolean) => { const src = brickFaceTex((A ? "firedA" : "firedB") + k, true, A ? "A" : ""); return ctex("vbGWFace3" + (A ? "A" : "N") + k, 512, 512, (g, r) => { g.drawImage(src.image as HTMLCanvasElement, 0, 0, 512, 512);
    const side = r() < 0.5 ? 0 : 512, fl = g.createLinearGradient(side, 0, 512 - side, 0); fl.addColorStop(0, `rgba(70,26,32,${0.3 + r() * 0.2})`); fl.addColorStop(0.5, "rgba(70,26,32,0)"); g.fillStyle = fl; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 16; i++) { const x = r() * 512, y = r() * 512, rad = 40 + r() * 120, dk = r() < 0.6, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, dk ? `rgba(78,34,26,${0.14 + r() * 0.16})` : `rgba(226,168,120,${0.1 + r() * 0.12})`); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    for (let i = 0; i < 0; i++) { let x = r() * 400, y = 40 + r() * 430;   /* r76d: two faint creases (more read as painted scratches) */ g.beginPath(); g.moveTo(x, y); for (let q = 0; q < 5; q++) { x += 18 + r() * 36; y += (r() - 0.5) * 26; g.lineTo(x, y); } g.strokeStyle = `rgba(58,22,14,${0.28 + r() * 0.22})`; g.lineWidth = 1.5 + r() * 2; g.stroke(); g.strokeStyle = "rgba(240,190,150,0.16)"; g.lineWidth = 1; g.stroke(); }
    for (let i = 0; i < 70; i++) { const x = r() * 512, y = r() * 512, q = 1.5 + r() * 3.5; g.fillStyle = "rgba(40,16,10,0.45)"; g.beginPath(); g.arc(x, y, q, 0, 6.3); g.fill(); g.fillStyle = "rgba(250,210,180,0.22)"; g.beginPath(); g.arc(x - q * 0.4, y - q * 0.4, q * 0.55, 0, 6.3); g.fill(); }
    for (let i = 0; i < 6; i++) { const top = r() < 0.5, x = r() * 470; g.fillStyle = `rgba(208,194,168,${0.2 + r() * 0.2})`; g.fillRect(x, top ? 0 : 504 - r() * 6, 30 + r() * 90, 4 + r() * 7); } }); };
  const gwNA = [0, 1, 2, 3].map((k) => lam("vbGWNA2" + k, () => ({ map: gwFace(k, false), bumpMap: bumpT, bumpScale: 3.6, color: new THREE.Color(...GWT[k]) } as THREE.MeshLambertMaterialParameters)));
  const gwA = [0, 1, 2, 3].map((k) => lam("vbGWA2" + k, () => ({ map: gwFace(k, true), bumpMap: bumpT, bumpScale: 3.6, color: new THREE.Color(...GWT[(k + 2) % 4]) } as THREE.MeshLambertMaterialParameters)));
  const oldB = [0, 1, 2, 3].map((k) => lam("vbTBold" + k, () => ({ map: brickFaceTex("old" + k, true), bumpMap: bumpT, bumpScale: 2.2, color: "#b08c84" } as THREE.MeshLambertMaterialParameters)));
  const loafTop = lam("byTloafTop#ffffff", () => ({ map: brickFaceTex("loafTop", false, "A"), color: "#ffffff" }));
  const timber = lam("byTtimber#a88a68", () => ({ map: beamHD(), color: "#a88a68" })), plank = lam("byTplank#b49474", () => ({ map: planksHD(), color: "#b49474" }));
  // ground: dirt road, cobbled pavements, grass verges, a stone gutter
  const road = lam("vbRoadM3", () => ({ map: rep(cobbleHD(), 1, 1), color: "#a8987e" } as THREE.MeshLambertMaterialParameters)); { const t = road.map as THREE.Texture; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 1.6); }   /* r44: cobbles at real size (they read twice a foot long) */   /* r26f: a cobbled street (the bare dirt read as dead ground) */   /* r26b: finer road grain with relief */
  b.add(quad(V(-60, 0, 3.2), V(60, 0, 3.2), V(60, 0, -3.2), V(-60, 0, -3.2), 1, 1), road);
  const cob = lam("vbCobble", () => ({ map: cobbleHD(), color: "#7c8064" })); { const t = cob.map as THREE.Texture; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(60, 1.2); }   /* r44: real-size lane setts */
  for (const s of [-1, 1]) b.add(quad(V(-60, 0.03, s > 0 ? 4.4 : -3.2), V(60, 0.03, s > 0 ? 4.4 : -3.2), V(60, 0.03, s > 0 ? 3.2 : -4.4), V(-60, 0.03, s > 0 ? 3.2 : -4.4), 1, 1), cob);
  for (const s of [-1, 1]) b.add(bx(120, 0.08, 0.14).translate(0, 0.04, s * 3.25), lam("vbKerb3", () => ({ map: rep(ctex("vbKerbT3", 1024, 128, (g, r) => { for (let k = 0; k < 8; k++) { const v = 150 + Math.floor(r() * 26); g.fillStyle = `rgb(${v},${v - 6},${v - 16})`; g.fillRect(k * 128, 0, 128, 128); for (let i = 0; i < 900; i++) { const d = r() < 0.5 ? 0 : 255; g.fillStyle = `rgba(${d},${d},${d},${0.03 + r() * 0.06})`; g.fillRect(k * 128 + r() * 128, r() * 128, 1 + r() * 3, 1 + r() * 3); } g.fillStyle = "rgba(60,50,40,0.75)"; g.fillRect(k * 128, 0, 3, 128); g.fillStyle = "rgba(255,250,240,0.12)"; g.fillRect(k * 128 + 3, 0, 2, 128); } }), 25, 1), color: "#d6cdbd" }))   /* r61: dressed kerb blocks with joints (the squashed stone texture read as stacked white stripes) */);   /* r49: real-size kerb stones, duller (one texture stretched 120 m read as a white streaked rail) */
  const grassM = lam("vbGrass", () => ({ map: rep(ctex("vbGrassT2", 512, 512, (g, r) => { g.fillStyle = "#587a44"; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 4200; i++) { g.strokeStyle = r() < 0.45 ? "rgba(156,186,96,0.75)" : r() < 0.7 ? "rgba(120,140,70,0.6)" : "rgba(44,74,30,0.65)"; g.lineWidth = 2; const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 4, y - 6 - r() * 8); g.stroke(); } for (let i = 0; i < 90; i++) { g.fillStyle = ["#f6f2e4", "#f4d040"][i % 2]; g.beginPath(); g.arc(r() * 512, r() * 512, 3, 0, TAU); g.fill(); } }), 1, 1) }));
  { const t = grassM.map as THREE.Texture; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(40, 30); }
  b.add(quad(V(-80, -0.005, 80), V(80, -0.005, 80), V(80, -0.005, -80), V(-80, -0.005, -80), 1, 1), grassM);
  // 3D ground near the action: raised cobbles along both pavements (x -24..30) and loose stones in the road ruts
  { const cobM = lam("vbCobStone", () => ({ map: stoneHD("vbCobT", ["#a89c88", "#9a8e7a", "#b2a690", "#8e8270"], "#6a5e50") })), r = rng(77), M4 = new THREE.Matrix4();
    // v14 r5: laid cobbles - staggered rows with mossy gaps, each stone its own height and colour (no random stamped discs)
    const g = (() => { const sg = new THREE.SphereGeometry(0.1, 10, 7); const pa = sg.attributes.position as THREE.BufferAttribute; for (let q = 0; q < pa.count; q++) { const k = 1 + 0.09 * Math.sin(pa.getX(q) * 61) * Math.cos(pa.getZ(q) * 47); pa.setXYZ(q, pa.getX(q) * k, pa.getY(q), pa.getZ(q) * k); } sg.computeVertexNormals(); return sg.scale(1.0, 0.32, 0.82).translate(0, 0.008, 0); })(), cells: [number, number][] = [];   /* r21: smooth rounded setts (the faceted ones read as plastic gems) */   // r12: irregular rounded stones, not discs
    for (const side of [-1, 1]) for (let row = 0; row < 6; row++) { const z = side * (3.36 + row * 0.19); for (let x = -24 + (row % 2) * 0.12; x < 30; x += 0.245) cells.push([x, z]); }
    const N = cells.length, setM = lam("vbSett", () => ({ color: "#ffffff" })), im = new THREE.InstancedMesh(g, setM, N), CC = new THREE.Color(), PAL = ["#8e7c64", "#7a6a56", "#9a8870", "#6a5c4c", "#857565", "#76716a", "#5e5850", "#93877a", "#6e6458", "#a08c70"];   /* r26: darker, mixed grey-brown setts (the pale ones read as eggs) */
    cells.forEach(([x, z], i) => { M4.compose(V(x + (r() - 0.5) * 0.06, 0.008, z + (r() - 0.5) * 0.05), new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.12, r() * 6.3, (r() - 0.5) * 0.12)), V(0.72 + r() * 0.4, 0.45 + r() * 0.3, 0.68 + r() * 0.4));   /* r60: flatter, bedded setts (6 cm humps swallowed the taxman's feet at the wall foot) */ im.setMatrixAt(i, M4); im.setColorAt(i, CC.set(PAL[Math.floor(r() * PAL.length)])); });
    im.castShadow = true; im.receiveShadow = true; root.add(im);
    const g2 = new THREE.DodecahedronGeometry(0.04, 0), im2 = new THREE.InstancedMesh(g2, lam("vbPeb2", () => ({ color: "#ffffff" })), 500), PC2 = new THREE.Color();
    for (let i = 0; i < 500; i++) { M4.compose(V(-24 + r() * 54, -0.004, (r() - 0.5) * 6), new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3)), V(0.5 + r(), 0.4, 0.5 + r())); im2.setMatrixAt(i, M4); im2.setColorAt(i, PC2.set(["#9a8468", "#7e7060", "#8c8478", "#6e6254", "#a89276"][Math.floor(r() * 5)])); }
    im2.castShadow = true; im2.receiveShadow = true; root.add(im2);
    // r6: a rutted road near the action: stones packed along the two wheel ruts and the verges, each lit with its own shadow
    { const g3 = smoothIco(0.06, 1), N3 = 2600, im3 = new THREE.InstancedMesh(g3, cobM, N3), CC = new THREE.Color(), P3 = ["#c2b294", "#b2a284", "#cab898", "#a69678", "#bcaa88"];   /* r60: round, warmer stones (faceted pale ones read as blue rocks in the sunset insert) */
      for (let i = 0; i < N3; i++) { const zone = r(), x = zone < 0.55 ? -6 + r() * 15 : -24 + r() * 14; const lane = Math.floor(r() * 4), zc = [-2.5, -1.2, 0.0, 2.5][lane], z = zc + (r() - 0.5) * (lane % 3 === 0 ? 1.0 : 0.6), sc = x < -10 ? 0.12 + r() * r() * 0.26 : 0.18 + r() * r() * 0.6;   /* r60: small stones in Church Lane */
        M4.compose(V(x, -0.005, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3)), V(sc * (0.9 + r() * 0.5), sc * 0.42, sc)); im3.setMatrixAt(i, M4); im3.setColorAt(i, CC.set(P3[Math.floor(r() * P3.length)])); }
      im3.castShadow = true; im3.receiveShadow = true; root.add(im3); } }
  // r12: Church Lane foreground - grass tufts along both verges and at the wall feet, a few larger cobbles, a shallow puddle
  { const tuftM = swayMaterial(mat("vbTuftM", () => new THREE.MeshLambertMaterial({ map: leafCut("tuft", "#5f8e3c", "#8cb85a", "#3e6a2c"), alphaTest: 0.5, side: THREE.DoubleSide })));
    const rt = rng(913), tb = new Batch();
    for (let i = 0; i < 0; i++) { const side = rt(), x = -21 + rt() * 10.5, z = side < 0.4 ? -3.05 + rt() * 0.35 : side < 0.75 ? 1.2 + rt() * 1.4 : -2.2 + rt() * 3.2; if (side >= 0.75 && rt() < 0.5) continue; const h = 0.08 + rt() * 0.1, w = h * (1.1 + rt() * 0.5), a = rt() * 3;
      for (const k of [0, 1.57]) tb.add(new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0).rotateY(a + k).translate(x, 0, z), tuftM); }
    // r13: small warm pebbles half sunk in the dirt (the bare grey blocks read as rocks)
    const stM = lam("vbPebWarm", () => ({ color: "#a08a70" }));
    for (let i = 0; i < 150; i++) { const sc = 0.02 + rt() * 0.045; tb.add(new THREE.DodecahedronGeometry(1, 1).scale(sc * (1 + rt() * 0.6), sc * 0.55, sc).rotateY(rt() * 3).translate(-20 + rt() * 9, -sc * 0.15, -2.4 + rt() * 3.4), stM); }
    tb.build(root);
    const pud = new THREE.Mesh(new THREE.CircleGeometry(1, 28).scale(0.75, 0.42, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: ctex("vbPudSky", 64, 64, (g) => { const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, "#f6c490"); gr.addColorStop(1, "#a8bcc8"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }), transparent: true, opacity: 0.6, depthWrite: false, toneMapped: true }));
    pud.position.set(-14.9, 0.012, -0.55); pud.receiveShadow = true; void pud; }   /* r40: no lane puddle (a dry sunset; it read as a flat decal) */
  // ---- houses: north side (front at z -4.4, yaw 0) and south side (front at z 4.4, yaw PI), skipping the custom lots ----
  const north: [number, number, number, number][] = [[-9.6, 5.2, 6.2, 1], [-4.0, 5.4, 5.6, 4], [9.4, 5.6, 6.4, 3], [24.0, 6.0, 5.8, 6], [30.6, 6.4, 6.6, 1], [36.8, 5.4, 5.6, 4]];
  for (const [x, w, h, si] of north) house(b, x, VIL.FRONT_N - 3.2, 0, w, 6.4, h, si, 0);
  const south: [number, number, number, number][] = [[-11.6, 6.2, 5.6, 0], [-5.2, 5.6, 6.2, 3], [0.8, 5.8, 5.6, 6], [7.0, 6.0, 6.4, 1], [13.4, 6.0, 5.8, 4], [19.6, 5.8, 6.2, 2], [25.8, 6.0, 5.6, 5], [32.2, 6.2, 6.0, 0]];
  for (const [x, w, h, si] of south) house(b, x, VIL.FRONT_S + 3.2, Math.PI, w, 6.4, h, si, 0);
  // ---- the bakery (north, x 1.6..6.4): cream front, a 3D bay window full of bread, the hanging sign, a stall ----
  house(b, VIL.BAKERY[0], VIL.FRONT_N - 3.2, 0, 4.8, 6.4, 5.8, 0, 0);
  const breadM = lam("vbBreadM", () => ({ map: loafBreadTex() }));
  const bay = new THREE.Group(); bay.position.set(VIL.BAKERY[0] - 0.9, 0, VIL.FRONT_N); root.add(bay);
  { const bb = new Batch(); const frameM = lam("vbBayFrame", () => ({ color: "#2f4a3a" }));
    bb.add(bx(2.0, 0.65, 0.55).translate(0, 0.33, 0.27), frameM); bb.add(bx(2.1, 0.1, 0.62).translate(0, 2.05, 0.3), frameM);
    for (const x of [-0.98, -0.33, 0.33, 0.98]) bb.add(bx(0.06, 1.4, 0.06).translate(x, 1.35, 0.52), frameM);
    bb.add(bx(1.9, 0.04, 0.42).translate(0, 0.67, 0.27), plank); bb.add(bx(1.9, 0.03, 0.3).translate(0, 1.2, 0.2), plank);
    const r = rng(3); for (let i = 0; i < 7; i++) { const g = new THREE.SphereGeometry(0.13, 12, 8, 0, TAU, 0, Math.PI / 2).scale(1.3, 0.85, 0.8); g.translate(-0.78 + i * 0.26, 0.69, 0.27 + (r() - 0.5) * 0.08); bb.add(g, breadM); }
    for (let i = 0; i < 6; i++) { const g = new THREE.SphereGeometry(0.11, 12, 8, 0, TAU, 0, Math.PI / 2).scale(1.2, 0.9, 0.8); g.translate(-0.7 + i * 0.28, 1.22, 0.2); bb.add(g, breadM); }
    bb.build(bay);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.96, 1.38), new THREE.MeshStandardMaterial({ color: "#c8dcf0", roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.22, depthWrite: false })); glass.position.set(0, 1.35, 0.55); bay.add(glass);
    glow(bay, [0, 1.1, 0.1], "#ffcf8a", 1.6, 0.5); }
  const signG = new THREE.Group(); signG.position.set(VIL.BAKERY[0] + 1.3, 3.2, VIL.FRONT_N); root.add(signG);
  { signG.add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1.1).translate(0, 0.42, 0.55), lam("vbIron", () => ({ color: "#2e2a30" })))); const sg = new THREE.Group(); sg.position.set(0, 0.4, 0.95); signG.add(sg);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.64), new THREE.MeshBasicMaterial({ map: shopSignTex(), toneMapped: true, side: THREE.DoubleSide })); face.rotation.y = Math.PI / 2; face.position.y = -0.36; sg.add(face); signG.userData.sg = sg; }
  // the bread stall out front: trestle table, a basket of loaves, a striped awning over the bay
  b.add(bx(1.4, 0.06, 0.6).translate(VIL.BAKERY[0] + 1.25, 0.82, VIL.FRONT_N + 0.65), plank);
  for (const x of [0.65, 1.85]) for (const z of [0.4, 0.9]) b.add(bx(0.06, 0.8, 0.06).translate(VIL.BAKERY[0] + x, 0.4, VIL.FRONT_N + z), timber);
  { const r = rng(9); for (let i = 0; i < 9; i++) { const g = new THREE.SphereGeometry(0.12, 12, 8, 0, TAU, 0, Math.PI / 2).scale(1.25, 0.8, 0.8); g.translate(VIL.BAKERY[0] + 0.75 + (i % 5) * 0.24, 0.85 + Math.floor(i / 5) * 0.06, VIL.FRONT_N + 0.5 + Math.floor(i / 5) * 0.25 + (r() - 0.5) * 0.04); b.add(g, breadM); } }
  const awnT = ctex("vbAwning", 256, 128, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f2ecdc" : "#2f6a43"; g.fillRect(i * 32, 0, 32, 128); } g.fillStyle = "rgba(0,0,0,0.15)"; g.fillRect(0, 110, 256, 18); });
  { const g = new THREE.PlaneGeometry(2.4, 0.9); g.rotateX(-Math.PI / 2 + 0.55); g.translate(VIL.BAKERY[0] - 0.9, 2.45, VIL.FRONT_N + 0.38); b.add(g, lam("vbAwnM", () => ({ map: awnT, side: THREE.DoubleSide }))); }
  // ---- Ned's plot (north, x 13.5..20.5): trench, a cottage of loaves rising, scaffold, mortar board, barrow, mug ----
  const plot = new THREE.Group(); plot.position.set(...VIL.PLOT); root.add(plot);
  const mortarM = lam("vbMortar4", () => ({ color: "#b49674" }));   /* r26b: a darker lime mortar (the pale bed read as sky-blue gaps) */
  b.add(bx(7.4, 0.02, 4.6).translate(VIL.PLOT[0], 0.012, VIL.PLOT[2] + 0.4), lam("vbSiteDirt6", () => ({ color: "#9a8c78",   /* r76i (both reviewers): a grey-brown dirt (in the sun its foreground patch read as a glowing orange slab) */   /* r76c: a duller earth (sunlit it blew out to an orange slab near the lens) */ map: rep(clayGroundTex("vbSite", "#a8845a"), 6, 4),   /* r35: warmer earth (it still read as a grey slab) */ bumpMap: rep(clayGroundBump("vbSiteBump"), 3, 2), bumpScale: 3.2 } as THREE.MeshLambertMaterialParameters)));   /* r26j: warm packed earth with relief (it read as a grey slab) */
  const courses: THREE.Group[] = [];
  { const NC = 12; for (let c = 0; c < NC; c++) { const cg = new THREE.Group(); cg.position.y = c * 0.215; plot.add(cg); const cb = new Batch();
      // running bond clipped to the wall's ends (half loaves at the ends, so the ends are flush and nothing overhangs)
      const X0 = -2.55, X1 = 2.245, st = X0 - (c % 2 ? BRL / 2 : 0);
      /* r36: the first four courses are Ned's old way, NORMAL bricks (two thin courses each); the loaves start where he tries one
       *  (a wall already built of loaves made "he tries one" meaningless) */
      if (c < 2) for (let sc = 0; sc < 2; sc++) {   /* r76e: two old courses, then loaves (the wall read as normal bricks on the loaves line) */ const st2 = X0 - ((c * 2 + sc) % 2 ? BRL / 2 : 0);
        for (let i = 0; i < 16; i++) { const a = Math.max(X0, st2 + i * BRL), e = Math.min(X1, st2 + (i + 1) * BRL); if (e - a < 0.06) continue; const g = bx(e - a - 0.012, 0.094, 0.17); g.translate((a + e) / 2, 0.012 + sc * 0.1075 + 0.047, 0); cb.add(g, i % 3 === 1 ? oldB[(c + i) % 4] : fired); }
      }   /* r37: no extra mortar strips (they read as grey slabs at the wall end) */
      else for (let i = 0; i < 16; i++) { const a = Math.max(X0, st + i * BRL), e = Math.min(X1, st + (i + 1) * BRL); if (e - a < 0.06) continue; const g = bx(e - a - 0.012, 0.2, 0.17); g.translate((a + e) / 2, 0.1 + 0.012, 0); cb.add(g, firedA[(c * 3 + i) % 4]); }
      cb.add(bx(X1 - X0 - 0.2, 0.215, 0.11).translate((X0 + X1) / 2, 0.1075, 0), lam("vbMortarCoreN6", () => ({ map: (firedNA[2] as THREE.MeshLambertMaterial).map, color: "#9a7a62" })));   /* r71: the core wears the brick face (its plain end read as a grey untextured column at the wall end) */   /* r70: a lime-mortar core 3.5 cm in from the ends (dark, the joints read as holes; r69: daylight showed through at the wall end) */   /* r64: brick-dark, 18 cm in from the ends (its dark ends showed as black blocks at the wall end) */   /* r63: one recessed dark lime core, full height, 2.5 cm in from each end (the grey bed plates stuck out at the wall end) */   /* r62: shorter and darker (its pale ends showed as grey blocks at the wall end) */   /* r61: a lime-mortar core 3.5 cm behind the faces, so every joint reads as mortar (reviewer: plastic bricks with no mortar) */
      void mortarM; /* r26j: no mortar core slab (it read as grey spacer slabs) */   // mortar bed + a core so no joint shows daylight   // mortar bed set back 8 mm, inside the wall's ends
      // the side return wall (x 2.4, going back) so it reads as a house corner
      for (let sc = 0; sc < (c < 2 ? 2 : 1); sc++) { const off = ((c < 2 ? c * 2 + sc : c) % 2) ? BRL / 2 : 0; for (let k = -1; k < 9; k++) { const z0 = Math.min(-0.09, -0.09 - off - k * BRL), z1 = Math.max(-2.2, -0.09 - off - (k + 1) * BRL); if (z0 - z1 < 0.06) continue; const hh = c < 2 ? 0.094 : 0.2; const g = bx(0.17, hh, z0 - z1 - 0.012); g.translate(2.33, 0.012 + sc * 0.1075 + hh / 2, (z0 + z1) / 2); cb.add(g, c < 2 ? fired : firedA[(c + k + 1) % 4]); } }   /* r37: the corner return clipped to the main wall (alternate courses left a hole at the corner) */   /* r36: thin normal courses under the loaves at the corner too */
      cb.add(bx(0.11, 0.215, 2.08).translate(2.33, 0.1075, -1.16), lam("vbMortarCoreN6", () => ({ map: (firedNA[2] as THREE.MeshLambertMaterial).map, color: "#9a7a62" })));   /* r76c: a core behind the return wall (its toothed bricks read as floating with gaps) */
      cb.build(cg); courses.push(cg); } }
  // scaffold poles stand BEHIND the wall (v14 AW: nothing tall in front of the builder's face)
  for (const [x, z] of [[-2.55, -0.45], [-2.55, -2.4]])   /* r39: only the far poles (the near ones landed on Ned's hat) */ b.add(new THREE.CylinderGeometry(0.05, 0.05, 3.6, 7).translate(VIL.PLOT[0] + x, 1.8, VIL.PLOT[2] + z), timber);   /* r37: the east poles moved off Ned's hat crown */
  void 0;
  // the plank on trestles at the front with the mug, mortar board + trowel, a stack and a barrow of loaves
  /* r76i (both reviewers): two loaves fallen off Amos's cart in the street's near foreground (its lower quarter was bare cobbles and nothing said "loaves") */
  for (const [x, z, ry, k] of [[-0.38, 1.48, 0.5, 1], [-0.06, 1.66, -0.3, 2]] as [number, number, number, number][]) b.add(bx(0.3, 0.2, 0.17).rotateZ(k === 2 ? 0.0 : 0.05).rotateY(ry).translate(x, 0.1, z), gwA[k]);
  /* r76i (reviewer): the mug stands on an upturned barrel (the stool on spindly legs looked unstable) */
  { const bw = lam("vbTeaBarrel", () => ({ map: beamHD(), color: "#a07a54" })), hoop = lam("vbTeaHoop", () => ({ color: "#3a3430" }));
    b.add(new THREE.CylinderGeometry(0.13, 0.145, 0.86, 18).translate(VIL.MUG[0], 0.43, VIL.MUG[2]), bw); b.add(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 18).translate(VIL.MUG[0], 0.87, VIL.MUG[2]), bw);
    for (const y of [0.14, 0.72]) b.add(new THREE.TorusGeometry(0.14 - (y > 0.5 ? 0.008 : 0), 0.012, 6, 24).rotateX(Math.PI / 2).translate(VIL.MUG[0], y, VIL.MUG[2]), hoop); }
  const mugM = lam("vbMug2", () => ({ color: "#c49a66" }))   /* r76: a stoneware mug (the flat blue read as plastic) */, teaM = lam("vbTea", () => ({ color: "#7a4a24" }));
  const mug = new THREE.Group(); mug.position.set(...VIL.MUG); mug.position.y += 0.025; root.add(mug);
  { const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.12, 18, 1, true).translate(0, 0.06, 0), mugM); (body.material as THREE.Material).side = THREE.DoubleSide; mug.add(body); mug.add(new THREE.Mesh(new THREE.CircleGeometry(0.056, 18).rotateX(-Math.PI / 2).translate(0, 0.1, 0), teaM)); mug.add(new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 6, 12, Math.PI).rotateZ(-Math.PI / 2).translate(0.065, 0.06, 0), mugM)); }
  const steam = [0, 1, 2, 3].map(() => mist(root, [VIL.MUG[0], VIL.MUG[1] + 0.2, VIL.MUG[2]], 0.22, "#ffffff", 0));
  /* r76g: no mortar board on the tea stool (the hand floated over it; it read as a blue saucer) */
  /* r26f: Ned's supply of Amos's loaves on a pallet at his feet (the site's ground read as bare concrete) */
  /* r26k: (the pallet of loaves at Ned's feet came out as a big foreground block: removed) */
  /* r35: a low pile of Amos's loaves at the wall's foot, left of Ned (his supply; the site ground read bare) */
  if (false as boolean) { const pb = new Batch(); for (let y = 0; y < 2; y++) for (let i = 0; i < 3 - y; i++) {   /* r39: (the pile said loaves were already in use before his first one: removed) */ const g = bx(0.3, 0.2, 0.17); g.rotateY(0.05 * (i - 1) + 0.03 * y); g.translate(17.72 + i * 0.31 + y * 0.15, 0.1 + y * 0.205, -5.5 - 0.02 * i); pb.add(g, firedA[(i + 2 * y) % 4]); } pb.build(root); }
  const stackL = new THREE.Group(); stackL.position.set(VIL.PLOT[0] - 3.4, 0, VIL.PLOT[2] + 1.6); root.add(stackL);
  { const sb = new Batch(); sb.add(bx(1.2, 0.1, 0.6).translate(0, 0.05, 0), plank); for (let y = 0; y < 5; y++) for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) sb.add(bx(0.36, 0.2, 0.17).translate(-0.38 + i * 0.38, 0.2 + y * 0.205, -0.18 + k * 0.18), fired); sb.build(stackL); }
  const cartN = handcart(root, firedA[1], timber, plank); cartN.position.set(VIL.PLOT[0] + 4.8, 0, VIL.PLOT[2] + 2.9); cartN.rotation.y = 2.4;
  // ---- Church Lane: the old cottage (normal bricks) and the taxman's new house (loaves), side by side ----
  const laneHouse = (c: V3, w: number, h: number, d: number, courseM: number, key: string, o: Parameters<typeof brickFront>[4], roofCol: string) => {
    const g = new THREE.Group(); g.position.set(...c); root.add(g); const hb = new Batch(), hw = w / 2, hd = d / 2;
    const front = lam("vbF2" + key, () => ({ map: brickFront(key, w, h, courseM, key === "taxman" ? { ...o, flat: true } : o) })), side = lam("vbS" + key, () => ({ map: brickFront(key + "s", d, h, courseM, { wins: [[d / 2 - 0.55, h * 0.55, 1.1, 1.2]], door: [-5, -5, 0.1, 0.1], doorCol: "#000" }) }));
    hb.add(quad(V(-hw, 0, hd), V(hw, 0, hd), V(hw, h, hd), V(-hw, h, hd)), front);
    hb.add(quad(V(hw, 0, hd), V(hw, 0, -hd), V(hw, h, -hd), V(hw, h, hd)), side); hb.add(quad(V(-hw, 0, -hd), V(-hw, 0, hd), V(-hw, h, hd), V(-hw, h, -hd)), side);
    hb.add(quad(V(hw, 0, -hd), V(-hw, 0, -hd), V(-hw, h, -hd), V(hw, h, -hd)), side);
    const rh = d * 0.45, ov = 0.35, rm = key === "taxman" ? lam("vbRoofTaxW", () => ({ map: roofWeathered(roofCol), side: THREE.DoubleSide })) : lam("vbRoof" + roofCol, () => ({ map: roofHD(roofCol, roofCol === "#6a7480"), side: THREE.DoubleSide }));   /* r68: a weathered tile roof on the new house (reviewers: one flat repeating pink tile like a game asset) */
    hb.add(quad(V(-hw - ov, h - 0.2, hd + ov), V(hw + ov, h - 0.2, hd + ov), V(hw + ov, h + rh, 0), V(-hw - ov, h + rh, 0), 2, 1), rm);
    hb.add(quad(V(hw + ov, h - 0.2, -hd - ov), V(-hw - ov, h - 0.2, -hd - ov), V(-hw - ov, h + rh, 0), V(hw + ov, h + rh, 0), 2, 1), rm);
    const gable = lam("vbGab" + key, () => ({ color: courseM > 0.15 ? "#c4613f" : "#a84d35" }));
    for (const s of [-1, 1]) { const tg = new THREE.BufferGeometry().setFromPoints([V(s * hw, h, s * hd), V(s * hw, h, -s * hd), V(s * hw, h + rh, 0)]); tg.computeVertexNormals(); hb.add(tg, gable); }
    hb.add(bx(0.8, 1.6, 0.8).translate(hw * 0.55, h + rh * 0.6, -hd * 0.3), gable); hb.add(bx(0.96, 0.14, 0.96).translate(hw * 0.55, h + rh * 0.6 + 0.85, -hd * 0.3), lam("vbCap", () => ({ color: "#9a8778" })));
    hb.add(bx(w + 0.14, 0.14, d + 0.14).translate(0, h - 0.27, 0), lam("vbCornice", () => ({ color: "#efe3c8" })));
    /* r68: a second chimney stack on the west end, a gutter along the front eave and a downpipe (reviewers: the roof had no chimney or gutter) */
    { const gm = lam("vbGutter", () => ({ color: "#2e2c32" }));
      hb.add(new THREE.CylinderGeometry(0.07, 0.07, w + 0.1, 10).rotateZ(Math.PI / 2).translate(0, h - 0.26, hd + ov - 0.02), gm);
      /* r76f: no downpipes (in the down-lane views they ran into the hats) */
      if (key === "taxman") { hb.add(bx(0.7, 1.9, 0.7).translate(-hw * 0.62, h + rh * 0.55, 0.15), gable); hb.add(bx(0.86, 0.14, 0.86).translate(-hw * 0.62, h + rh * 0.55 + 1.0, 0.15), lam("vbCap", () => ({ color: "#9a8778" })));
        for (const px of [-0.16, 0.16]) hb.add(new THREE.CylinderGeometry(0.1, 0.12, 0.34, 10).translate(-hw * 0.62 + px, h + rh * 0.55 + 1.24, 0.15), lam("vbPot", () => ({ color: "#b0603e" }))); } }
    hb.add(bx(1.5, 0.16, 0.6).translate(o.door[0] + o.door[2] / 2 - hw, 0.08, hd + 0.3), lam("vbStep", () => ({ map: stoneHD("vbStepT") })));
    /* r56: real stone sills, lintels and a door hood standing proud of the front (reviewers: "the house is one flat textured plane") */
    { const st = lam("vbSill3d", () => ({ map: stoneHD("vbSillT"), color: "#efe6d4" }));
      for (const [x, y, ww, hh] of o.wins) { const cx = x + ww / 2 - hw;
        hb.add(bx(ww + 0.26, 0.075, 0.13).translate(cx, y - 0.11, hd + 0.065), st);
        hb.add(bx(ww + 0.22, 0.13, 0.07).translate(cx, y + hh + 0.16, hd + 0.035), st);
        for (const sx of [-1, 1]) hb.add(bx(0.06, hh + 0.2, 0.04).translate(cx + sx * (ww / 2 + 0.06), y + hh / 2, hd + 0.02), st); }
      const [dx, , dw, dh] = o.door; if (dx > -1) { const cx = dx + dw / 2 - hw;
        hb.add(bx(dw + 0.5, 0.1, 0.3).translate(cx, dh + 0.18, hd + 0.15), st);
        for (const sx of [-1, 1]) hb.add(bx(0.12, dh + 0.12, 0.06).translate(cx + sx * (dw / 2 + 0.13), (dh + 0.12) / 2, hd + 0.03), st); } }
    hb.build(g);
    /* r70: the new house is built of real loaves - bevelled 3D blocks (0.36 x 0.21, double a brick course) over recessed mortar, each with its own
     *  tint, a third of them stamped A; the low sun puts a lit top edge and a joint shadow on every one (reviewers: the front read as flat printed tile) */
    if (key === "taxman") {
      /* r71: loaf proportion (0.30 x 0.21, like the yard loaves), cut to fit round every window and the door instead of dropped (isolated
       *  bricks floated between the windows), grey lime joints, tints pulled off the orange, nearly half stamped A */
      const LW = 0.3, LH = 0.25, J = 0.016, D = 0.022,   /* r76i (reviewers): chunkier loaves on the front, every one stamped (they read as ordinary bricks) */   /* r76i (both reviewers): flush loaves in thin lime joints (deep joints under the raking sun read as Lego on black gaps) */   /* r76e: wider, deeper-reading joints */ top = h - 0.36;
      const open: [number, number, number, number][] = [...o.wins.map(([x, y, ww, hh]) => [x - 0.13, y - 0.13, ww + 0.26, hh + 0.27] as [number, number, number, number]), [o.door[0] - 0.12, -1, o.door[2] + 0.24, o.door[3] + 1.15], [w / 2 - 0.5, h - 0.79, 1.0, 0.5]];
      const geo = new RoundedBoxGeometry(LW - J, LH - J, D, 1, 0.01), rr = rng(9091), cells: { x: number; y: number; w: number; m: number }[] = [];
      for (let row = 0, y = 0.02; y + LH <= top + 0.001; row++, y += LH) for (let x = row % 2 ? -LW / 2 : 0; x < w - 0.001; x += LW) {
        let segs: [number, number][] = [[Math.max(0, x), Math.min(w, x + LW)]];
        for (const [ox, oy, ow2, oh] of open) if (y + LH > oy + 0.02 && y < oy + oh - 0.02) segs = segs.flatMap(([a, b]): [number, number][] => b <= ox || a >= ox + ow2 ? [[a, b]] : ([[a, Math.min(b, ox)], [Math.max(a, ox + ow2), b]] as [number, number][]).filter(([c, d]) => d - c > 0.001));
        for (const [a, b] of segs) if (b - a >= 0.07) cells.push({ x: (a + b) / 2, y: y + LH / 2, w: b - a, m: b - a > 0.2 && rr() < 0.2 ? 8 + Math.floor(rr() * 4) : Math.floor(rr() * 8) });   /* r76i (both reviewers: every loaf stamped read as wallpaper): about one in five stamped */   /* r76e: eight weathered faces (four repeated as wallpaper) */   /* r76d: fewer stamps (the same A on every loaf read as wallpaper) */ }
      /* r73: the facade loaves get a bigger, deeper pressed A that reads at a distance (the yard stamp vanished on the front) */
      const stampF = [0, 1, 2, 3].map((k) => lam("vbLoafStampF2" + k, () => ({ map: ctex("vbLoafStampT2" + k, 512, 512, (g) => { g.drawImage((gwFace((k + 1) % 4, false).image as unknown) as CanvasImageSource, 0, 0, 512, 512);
        g.font = "900 230px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "rgba(255,226,196,0.35)"; g.fillText("A", 262, 274); g.fillStyle = "rgba(52,20,10,0.86)"; g.fillText("A", 256, 266); }), bumpMap: bumpT, bumpScale: 2.2 } as THREE.MeshLambertMaterialParameters)));
      const facW = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => lam("vbLoafW" + k, () => ({ map: gwFace(k, false), bumpMap: bumpT, bumpScale: 2.2 } as THREE.MeshLambertMaterialParameters)));   /* r76: weathered faces (fire-flashed ends, creases, pits) - the front read as flat orange tiles */
      const mats = [...facW, ...stampF], M = new THREE.Matrix4(), C = new THREE.Color();
      for (let k = 0; k < 12; k++) { const cs = cells.filter((c) => c.m === k); if (!cs.length) continue;
        const im = new THREE.InstancedMesh(geo, mats[k], cs.length);
        cs.forEach((c, i) => { M.compose(new THREE.Vector3(c.x - hw + (rr() - 0.5) * 0.004, c.y + (rr() - 0.5) * 0.004, hd + D / 2 + 0.002 + (rr() - 0.5) * 0.006), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, (rr() - 0.5) * 0.02 + (k < 8 && rr() < 0.5 ? Math.PI : 0), (rr() - 0.5) * 0.012))   /* r76: half the plain loaves turned end for end (mirrored face: the same four tiles repeated) */, new THREE.Vector3((c.w - J) / (LW - J), 1, 1)); im.setMatrixAt(i, M);
          const q = rr(), v = (q < 0.18 ? 0.42 : 0.6) + rr() * 0.44, lime = q > 0.88 ? 0.14 : 0, hue = (rr() - 0.5) * 0.12;   /* r76i (both reviewers): a wider firing spread with hue shifts (the front read as one repeated tile) */   /* r76d: a wider spread */   /* r73: a wider spread - burnt headers, lime-bloomed faces (the front read as one repeated tile) */
          im.setColorAt(i, C.setRGB(v * (0.72 + hue) + lime, v * (0.76 + rr() * 0.1 - hue * 0.5) + lime, v * (0.88 + rr() * 0.12 - hue) + lime)); });
        im.castShadow = true; im.receiveShadow = true; g.add(im); }
      /* r73: weathering over the new front - soot runs under every sill and the cornice, a damp band at the foot, lichen and grime patches (reviewers: clean plastic tiling) */
      { const PX = 120, W2 = Math.round(w * PX), H2 = Math.round(h * PX);
        const gt = ctex("vbTaxGrime3", W2, H2, (gg, r) => { gg.clearRect(0, 0, W2, H2);
          const run = (x: number, y: number, ww: number, len: number, a2: number) => { const gr = gg.createLinearGradient(0, y, 0, y + len); gr.addColorStop(0, `rgba(36,24,20,${a2})`); gr.addColorStop(1, "rgba(36,24,20,0)"); gg.fillStyle = gr; gg.fillRect(x, y, ww, len); };
          for (const [x, y, ww] of o.wins) for (let k = 0; k < 6; k++) run((x + 0.05 + r() * (ww - 0.1)) * PX, H2 - (y - 0.12) * PX, (0.03 + r() * 0.08) * PX, (0.4 + r() * 0.9) * PX, 0.3 + r() * 0.2);
          for (let k = 0; k < 40; k++) run(r() * W2, (0.36 + r() * 0.1) * PX, (0.04 + r() * 0.12) * PX, (0.3 + r() * 1.2) * PX, 0.2 + r() * 0.18);
          const dmp = gg.createLinearGradient(0, H2, 0, H2 - 0.75 * PX); dmp.addColorStop(0, "rgba(40,34,26,0.55)"); dmp.addColorStop(1, "rgba(40,34,26,0)"); gg.fillStyle = dmp; gg.fillRect(0, H2 - 0.75 * PX, W2, 0.75 * PX);
          for (let k = 0; k < 160; k++) { const x = r() * W2, y = H2 - r() * r() * 1.2 * PX; gg.fillStyle = `rgba(${110 + r() * 40},${120 + r() * 30},${70},${0.25 + r() * 0.3})`; gg.beginPath(); gg.arc(x, y, 1 + r() * 4, 0, Math.PI * 2); gg.fill(); }
          for (let k = 0; k < 26; k++) { const x = r() * W2, y = r() * H2, rad = (0.15 + r() * 0.45) * PX; const gr = gg.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(50,34,28,${0.1 + r() * 0.12})`); gr.addColorStop(1, "rgba(50,34,28,0)"); gg.fillStyle = gr; gg.fillRect(x - rad, y - rad, rad * 2, rad * 2); } });
        const gm = new THREE.Mesh(new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0), new THREE.MeshLambertMaterial({ map: gt, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
        gm.position.z = hd + D + 0.007; gm.renderOrder = 3; gm.receiveShadow = true; g.add(gm); } }
    return g;
  };
  laneHouse(VIL.COTTAGE, 6.0, 4.2, 4.6, 0.105, "cottage", { wins: [[0.6, 1.0, 1.15, 1.3], [4.25, 1.0, 1.15, 1.3], [2.45, 2.65, 1.15, 1.05]], door: [2.5, 0, 1.0, 2.0], doorCol: "#5a6a3a", lit: [0, 2] }, "#6a7480");
  const taxHouse = laneHouse(VIL.TAXHOUSE, 6.4, 6.6, 5.0, 0.3, "taxman",   /* r58: loaf-sized courses (the front read as ordinary bricks next to the garden wall loaves) */   /* r48: taller courses (the front read as ordinary 2:1 bricks) */ { wins: [[0.7, 1.0, 1.15, 1.3], [4.55, 1.0, 1.15, 1.3], [0.7, 3.9, 1.15, 1.3], [2.62, 3.9, 1.15, 1.3], [4.55, 3.9, 1.15, 1.3]], door: [2.7, 0, 1.0, 2.0], doorCol: "#6a4a2a", date: "1785", plaque: "TAX MAN",   /* r76i (both reviewers): the narration never names him - the plate says what he is */ lit: [3] }, "#8a4c3e");   /* r51: his name plate on the door (nothing said it was his house) */   // r21: no EXCISE plate (it read as the tax office, not his new home)
  // garden walls (cottage: normal bricks; taxman: loaves, so the comparison is also at eye height) + picket gates
  const gw = (x0: number, x1: number, z: number, ch: number, n: number) => { for (let c = 0; c < n; c++) for (let x = x0 + (c % 2 ? FL / 2 : 0); x + FL <= x1 + 0.01; x += FL) b.add(bx(FL - 0.016, ch - 0.016, 0.17).translate(x + FL / 2, c * ch + ch / 2, z), (ch > 0.15 ? ((((c * 7 + Math.round(x * 13) + c * c * 3) % 9 + 9) % 9 < 3 || (c === 1 && Math.abs(x + 14.95) < 0.02)) ? gwA : gwNA)   /* r76: darker, varied garden-wall loaves (the insert clipped to flat orange, R 254) */   /* r62: the loaf under the rule carries the A (reviewers: it measured an unstamped brick) */   /* r59: one in three, in no regular step (the 2-in-5 diagonal read as a tiled pattern) */ : oldB)[((c * 3 + Math.round(x * 7)) % 4 + 4) % 4]); };   /* r39: the A on two loaves in five (one stamp on every block read as wallpaper) */
  gw(-26.0, -23.8, -3.9, 0.105, 6); gw(-22.4, -20.1, -3.9, 0.105, 6);
  gw(-19.95, -17.6, -3.9, 0.21, 3); gw(-16.0, -13.6, -3.9, 0.21, 3);
  /* r44: a mortar core inside both loaf walls (the joints showed the green garden straight through) */
  for (const [a0, a1] of [[-19.95, -17.6], [-16.0, -13.6]] as const) b.add(bx(a1 - a0 - 0.01, 0.62, 0.13).translate((a0 + a1) / 2, 0.31, -3.9), lam("vbMortarCore4", () => ({ color: "#8a7e70", map: rep(ctex("vbLimeT", 128, 128, (g, r) => { g.fillStyle = "#b8ae9c"; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "rgba(90,80,66,0.35)" : "rgba(235,228,210,0.35)"; g.fillRect(r() * 128, r() * 128, 1.5, 1.5); } }), 4, 1) }))   /* r76c: grey sandy lime joints (the brown core read as wooden planks) */   /* r59: warm lime-and-sand brown (the grey core read blue-grey in the sunset insert) */   /* r57: dark recessed joints (the pale core read as white bathroom grout) */);
  /* r48: a black wrought-iron gate with spear tops between the brick piers (the white pickets read as American) */
  { const ir = lam("vbIronRail", () => ({ color: "#26262c" })); for (let i = 0; i < 13; i++) { const x = -17.5 + i * 0.12; b.add(bx(0.022, 0.92, 0.022).translate(x, 0.46, -3.9), ir); b.add(new THREE.ConeGeometry(0.03, 0.08, 4).translate(x, 0.96, -3.9), ir); }
    for (const y of [0.12, 0.8]) b.add(bx(1.5, 0.035, 0.03).translate(-16.8, y, -3.9), ir); }
  /* r68: gravel garden floors between the garden walls and both house fronts (the lawn plane showed through the gate as a bright green block) */
  { const gv = lam("vbGravel", () => ({ map: rep(ctex("vbGravelT", 256, 256, (g, r) => { g.fillStyle = "#6e6458"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 1800; i++) { const v = 70 + Math.floor(r() * 70); g.fillStyle = `rgb(${v + 12},${v + 4},${v - 6})`; g.beginPath(); g.ellipse(r() * 256, r() * 256, 1 + r() * 2.6, 1 + r() * 2, r() * 3, 0, Math.PI * 2); g.fill(); } }), 6, 2) }));
    b.add(quad(V(-26, 0.004, -3.95), V(-13.6, 0.004, -3.95), V(-13.6, 0.004, -4.95), V(-26, 0.004, -4.95), 1, 1), gv); }
  /* r60: the taxman's front garden behind the wall and gate: a flagstone path to the door and box shrubs either side
   *  (reviewers: a flat green bar showed through the railings in f_1766 / f_1840) */
  { const shrubM = mat("vbShrubM", () => new THREE.MeshLambertMaterial({ map: leafSolid("box", "#3f7a34", "#6ea24c", "#2e5a28") })), flag = lam("vbFlag", () => ({ map: rep(stoneHD("vbFlagT", ["#9a8e7c", "#8c806e", "#a49884", "#857a6a"], "#5e5446"), 1, 2) }));
    b.add(bx(1.0, 0.02, 1.0).translate(-16.8, 0.01, -4.4), lam("vbFlagD2", () => ({ map: (flag as THREE.MeshLambertMaterial).map, color: "#5a524a" })));   /* r63: darker (the sunlit flags glowed as an orange smear through the gate) */
    const rs = rng(3307); for (const x of [] as number[]) {   /* r65: no shrubs (the far one's sunlit crown showed through the gate as an orange crescent) */   /* r64: only the far shrubs (seen through the gate, the sunlit near ones blurred into orange-green smears) */ const rr = 0.26 + rs() * 0.08; b.add(smoothIco(rr, 2).scale(1.15, 0.85, 0.9).translate(x, rr * 0.7, -4.3 - rs() * 0.15), shrubM); } }
  // the measuring stick hung by the taxman's door (scene 9: he holds it up to his own brick)
  const stick = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.02), new THREE.MeshBasicMaterial({ map: stickTex(), toneMapped: true })); stick.position.set(VIL.TAXDOOR[0] + 0.95, 1.3, VIL.TAXDOOR[2] - 0.38); root.add(stick);
  // r44: street-life along the north pavement west of the bakery (the street behind the laugher read as a bare wall):
  // barrels and a crate by a door, a bench, a hanging shop sign, a water butt
  { const sb2 = new Batch(), wd = lam("vbStreetWood", () => ({ map: beamHD(), color: "#9a7650" }));
    barrel(root, [-9.5, 0, -3.92], 0.42, 0.3); barrel(root, [-10.15, 0, -3.88], 0.38, 1.2); barrel(root, [-3.45, 0, -3.95], 0.44, 2.0);
    crate(sb2, root, [-10.9, 0, -3.95], 0.5, undefined, 0.2);
    sb2.add(bx(1.3, 0.06, 0.34).translate(-12.0, 0.45, -3.95), wd); for (const x of [-12.55, -11.45]) sb2.add(bx(0.06, 0.45, 0.3).translate(x, 0.225, -3.95), wd);
    sb2.add(bx(0.05, 0.05, 0.7).translate(-8.8, 2.75, -3.95), lam("vbIron", () => ({ color: "#2e2e34" }))); sb2.add(bx(0.62, 0.42, 0.04).translate(-8.8, 2.45, -3.62), wd);
    sb2.build(root); }
  // r43: Ned's site dressed (it read as a bare wall on a lawn): a mortar tub with a trowel by his feet, a tall stack of
  // loaves on a pallet behind the wall's far end, a ladder against it (only in the spring scene)
  const siteDress = new THREE.Group(); siteDress.visible = false; root.add(siteDress);
  { const sb = new Batch(), wood = lam("vbTub", () => ({ map: beamHD(), color: "#9a7650" })), mort = lam("vbMortar", () => ({ color: "#b8b0a2" }));
    sb.add(new THREE.CylinderGeometry(0.26, 0.22, 0.2, 18).translate(18.2, 0.1, -5.78), wood); sb.add(new THREE.CylinderGeometry(0.235, 0.235, 0.02, 18).translate(18.2, 0.18, -5.78), mort);   /* r48: back against the wall (cut by the frame corner it read as an unexplained tub) */
    sb.add(bx(0.11, 0.008, 0.07).rotateZ(-0.9).translate(18.26, 0.24, -5.76), lam("vbTrowel4", () => ({ color: "#6a5a4a" }))); sb.add(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 6).rotateZ(-0.9).translate(18.33, 0.31, -5.76), wood);
    for (let i = 0; i < 3; i++) sb.add(bx(0.98, 0.03, 0.1).translate(16.9, 0.075, -7.36 + i * 0.16), wood);
    for (let c = 0; c < 6; c++) for (let i = 0; i < 3; i++) sb.add(bx(FL - 0.014, 0.205, 0.165).translate(16.6 + i * 0.3 + (c % 2 ? 0.04 : -0.04), 0.09 + c * 0.212 + 0.1025, -7.2), (c * 3 + i) % 3 ? firedNA[(c + i) % 4] : firedA[(c + i) % 4]);
    /* r69: a dark core inside the loaf stack (sky showed through its joints as a white hole) */ sb.add(bx(0.8, 1.22, 0.1).translate(16.9, 0.09 + 0.636, -7.2), lam("vbStackCore", () => ({ color: "#5e3a2c" })));
    /* r47: a short ladder resting on the stacked loaves (the tall one leaned on empty sky) */ for (const sd of [-0.2, 0.2]) sb.add(new THREE.CylinderGeometry(0.03, 0.03, 1.56, 6).rotateX(-0.28).translate(17.05 + sd, 0.7, -6.97), wood);
    for (let y = 0.2; y < 1.45; y += 0.3) sb.add(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6).rotateZ(Math.PI / 2).translate(17.05, y, -6.97 - (y - 0.7) * 0.29 + 0.0), wood);
    /* r60: the site floor near the lens is worked ground (reviewers: plain dirt in the bottom tenth): brick chips, two broken bats,
     *  mortar splats, clear of Ned's feet */
    { const rr = rng(4471), chip = lam("vbChip", () => ({ color: "#9a4a30" })), chip2 = lam("vbChip2", () => ({ color: "#b8603e" }));
      for (let i = 0; i < 46; i++) { const x = 18.3 + rr() * 1.5, z = -5.15 - rr() * 0.75; if (Math.hypot(x - 18.85, z + 5.6) < 0.22) continue; const sc = 0.012 + rr() * rr() * 0.04;
        sb.add(bx(sc * (1.2 + rr()), sc * 0.7, sc).rotateY(rr() * 3).rotateZ((rr() - 0.5) * 0.4).translate(x, sc * 0.3, z), rr() < 0.5 ? chip : chip2); }
      /* r68: the two broken bats in the wall's own brick-red, bedded in the dirt with a dark contact patch (they read pink and floating) */
      { const batM = lam("vbBat", () => ({ map: (firedNA[1] as THREE.MeshLambertMaterial).map, color: "#9a5a48" })), cm = new THREE.MeshBasicMaterial({ color: "#2a1c14", transparent: true, opacity: 0.55, depthWrite: false });
        for (const [x, z, a] of [[19.35, -5.35, 0.6], [18.45, -5.3, -0.4]] as const) { sb.add(bx(0.13, 0.06, 0.1).rotateY(a).rotateZ(0.05).translate(x, 0.024, z), batM);
          const cp = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16).rotateX(-Math.PI / 2).scale(1.05, 1, 0.75), cm); cp.position.set(x + 0.01, 0.003, z + 0.01); cp.rotation.y = a; cp.renderOrder = 2; siteDress.add(cp); } }
      /* r68: worked ground under the site: trodden darker dirt, boot prints, sand and mortar crumbs, grass tufts at the edge (reviewers: flat dirt) */
      { const gt = ctex("vbSiteGround2", 1024, 512, (g, r) => { g.clearRect(0, 0, 1024, 512);
          for (let i = 0; i < 140; i++) { const x = r() * 1024, y = r() * 512, rr = 20 + r() * 60; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, `rgba(${60 + r() * 30},${42 + r() * 20},${30},${0.18 + r() * 0.16})`); gr.addColorStop(1, "rgba(60,42,30,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
          for (let i = 0; i < 26; i++) { const x = 120 + r() * 780, y = 80 + r() * 360, a = r() * 6.3; for (const sx of [-1, 1]) { g.save(); g.translate(x + sx * 14 * Math.cos(a + 1.57), y + sx * 14 * Math.sin(a + 1.57)); g.rotate(a); g.fillStyle = "rgba(40,28,20,0.32)"; g.beginPath(); g.ellipse(0, 0, 22, 9, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = "rgba(40,28,20,0.22)"; for (let k = -2; k <= 2; k++) g.fillRect(-14 + k * 6, -6, 3, 12); g.restore(); } }
          for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.6 ? `rgba(${200 + r() * 40},${180 + r() * 30},${140 + r() * 30},${0.35 + r() * 0.3})` : `rgba(${150 + r() * 40},${70 + r() * 30},${48},${0.4})`; g.fillRect(r() * 1024, r() * 512, 1.5 + r() * 2.5, 1.5 + r() * 2); }
          for (let i = 0; i < 90; i++) { const x = r() < 0.5 ? r() * 90 : 934 + r() * 90, y = r() * 512; g.strokeStyle = `rgba(${70 + r() * 30},${110 + r() * 40},${50},0.85)`; g.lineWidth = 2; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 18, y - 8 - r() * 16); g.stroke(); } } });
        const gd = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: gt, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); gd.position.set(18.9, 0.004, -5.0); gd.renderOrder = 1; siteDress.add(gd); }
      /* r68: a timber scaffold behind the far end (two lashed poles, ledgers and a plank) and a mortar board on a stand by the tub */
      { const pole = lam("vbScafPole2", () => ({ map: barkTex(), color: "#d8c4a0", emissive: "#3a3024" }))   /* r69: weathered pale poles (they read flat near-black against the sky) */, plank2 = lam("vbScafPlank", () => ({ map: beamHD(), color: "#a88660" })), rope = lam("vbRope", () => ({ color: "#c8b088" }));
        for (const x of [16.2, 17.9]) for (const z of [-7.55, -6.75]) sb.add(new THREE.CylinderGeometry(0.045, 0.05, 3.0, 8).translate(x, 1.5, z), pole);
        for (const z of [-7.55, -6.75]) for (const y of [1.55, 2.6]) sb.add(new THREE.CylinderGeometry(0.035, 0.035, 2.0, 8).rotateZ(Math.PI / 2).translate(17.05, y, z), pole);
        for (let i = 0; i < 3; i++) sb.add(bx(2.0, 0.04, 0.24).translate(17.05, 1.6, -7.45 + i * 0.27), plank2);
        for (const x of [16.2, 17.9]) for (const z of [-7.55, -6.75]) sb.add(new THREE.TorusGeometry(0.055, 0.014, 6, 10).rotateX(Math.PI / 2).translate(x, 1.55, z), rope);
        sb.add(bx(0.32, 0.025, 0.32).translate(17.72, 0.62, -5.55), plank2); sb.add(new THREE.CylinderGeometry(0.02, 0.025, 0.6, 6).translate(17.72, 0.3, -5.55), pole); sb.add(smoothIco(0.07, 2).scale(1.2, 0.5, 1).translate(17.72, 0.66, -5.55), mort); }
      for (const [x, z, r0] of [[19.1, -5.45, 0.07], [18.6, -5.55, 0.05], [19.5, -5.7, 0.06]] as const) sb.add(new THREE.CylinderGeometry(r0, r0 * 1.15, 0.012, 14).scale(1, 1, 0.7).translate(x, 0.006, z), mort); }
    sb.build(siteDress); }
  // r42: the builders' spare loaves on a low pallet at the lane's edge in front of the taxman's house (the near corner of the
  // low reveal: loaves in the foreground, the house of loaves behind, instead of bare cobbles)
  const pile = new THREE.Group(); pile.position.set(-15.35, 0, -1.75); pile.rotation.y = 0.5; root.add(pile);
  { const pg = pile, pb = new Batch();
    for (let i = 0; i < 3; i++) pb.add(bx(0.66, 0.03, 0.1).translate(0, 0.075, -0.17 + i * 0.17), lam("vbPallet", () => ({ map: beamHD(), color: "#a8865e" })));
    for (const z of [-0.18, 0.18]) pb.add(bx(0.66, 0.06, 0.08).translate(0, 0.03, z), lam("vbPallet", () => ({ map: beamHD(), color: "#a8865e" })));
    const L: [number, number, number, number][] = [[-0.16, 0, 0, 1], [0.16, 0, 0, 2], [0.0, 1, 0.0, 0]];   /* r44: one row and one on top (the pallet reached 35 % across) */
    for (const [x, lv, z, k] of L) pb.add(bx(FL - 0.012, 0.205, 0.165).rotateY((k - 1.5) * 0.03).translate(x, 0.09 + lv * 0.21 + 0.1025, z), (k % 2 ? firedA : firedNA)[k]);
    pb.build(pg); }
  // r42: the new 3-inch rule set upright against the top loaf of the taxman's own garden wall (scene 9 insert, control rule
  // 0/1, ruleTilt settles it): 3 in at the yard's scale (1 in = 0.042) against a 5 in loaf - the loaf towers over it
  /* r46: a 3-inch GAUGE block (0.13 x 0.118, true 3:5 against the 0.196 loaf face), thick, shadow-casting: "3 IN" across a red
   *  cap, inch marks only at 1 and 2 (the narrow rule was a sliver and its ticks made the loaf read 6 in) */
  /* r47: a boxwood 3-inch rule standing on the loaf's own bottom joint at its left end (the A clear), marked 0-3 with brass
   *  ends and "3 IN" along it, no ink outline (it read as a sticker); a red chalk bracket marks the 2 inches of loaf above it */
  const ruleTex = ctex("vbGauge7", 844, 1024, (g, r) => { g.fillStyle = "#e8cc94"; g.fillRect(0, 0, 844, 1024);   /* r76i (both reviewers): a 6-inch rule as tall as the loaf - 0 on its bottom edge at the loaf's base, 6 at its top edge, the 3 in limit in red at mid-height; no "0" figure (it read as the zero) */
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(${130 + r() * 30},${90 + r() * 20},40,${0.08 + r() * 0.1})`; g.fillRect(r() * 844, 0, 2 + r() * 5, 1024); }
    const eg = g.createLinearGradient(0, 0, 844, 0); eg.addColorStop(0, "rgba(90,60,20,0.28)"); eg.addColorStop(0.06, "rgba(90,60,20,0)"); eg.addColorStop(0.94, "rgba(90,60,20,0)"); eg.addColorStop(1, "rgba(90,60,20,0.28)"); g.fillStyle = eg; g.fillRect(0, 0, 844, 1024);
    g.fillStyle = "#2a1a10"; for (let k = 1; k < 24; k++) { const y = 1024 - k * 1024 / 24, big = k % 4 === 0, half = k % 2 === 0; g.fillRect(0, y - (big ? 4 : 2.5), big ? 300 : half ? 190 : 110, big ? 8 : 5); }
    g.fillRect(0, 1012, 844, 12); g.fillRect(0, 0, 844, 10);   /* the 0 and 6 ends */
    g.fillStyle = "#c8261e"; g.fillRect(0, 506, 844, 12);   /* the 3 in limit line, red */
    g.font = "900 104px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#2a1a10";
    for (let k = 1; k <= 6; k++) { const y = 1024 - k * 1024 / 6; g.fillStyle = k === 3 ? "#c8261e" : "#2a1a10"; g.fillText(String(k), 470, Math.max(62, y + (k === 6 ? 0 : 0))); }
    g.save(); g.translate(740, 760); g.rotate(-Math.PI / 2); g.fillStyle = "#2a1a10"; g.font = "900 58px Georgia, serif"; g.fillText("INCHES", 0, 0); g.restore(); });
  const ruleM = new THREE.MeshLambertMaterial({ map: ruleTex }), ruleSide = new THREE.MeshLambertMaterial({ color: "#c8a46a" }); const rule = new THREE.Group(); { const rm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.194, 0.012),   /* r76e: scaled so the loaf reads exactly 6 in (twice the 3 in limit) */   /* r76b: broader (it was 22 % of the insert) */   /* r58: a broader rule (it was a 19 % sliver) */ [ruleSide, ruleSide, ruleSide, ruleSide, ruleM, ruleSide]); rm.position.y = 0.097; rm.castShadow = true; rule.add(rm); }
  /* r60: two nails pin the rule to the loaf (reviewer: it floated on the wall) */ for (const ny of [0.182, 0.012]) { const nl = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.006, 12).rotateX(Math.PI / 2), lam("vbNail", () => ({ color: "#3a3a40" }))); nl.position.set(0.024, ny, 0.009); rule.add(nl); }
  rule.position.set(-14.975, 0.218,   /* r76i: left onto the joint, the A stamp clear (it hid half the stamp) */ -3.9 + 0.085 + 0.0062);   /* r76e: the 0 on the loaf's bottom arris */   /* r76c: the 0 on the loaf's bottom arris */
  const ruleRefs: THREE.Object3D[] = [];
  /* r64: the taxman's brass name plate on his own garden wall, in the insert's top course (reviewers: it never read as HIS wall) */
  { const pt = ctex("vbWallPlate2", 320, 120, (g) => { const gr = g.createLinearGradient(0, 0, 0, 120); gr.addColorStop(0, "#f0d27a"); gr.addColorStop(0.5, "#c89a40"); gr.addColorStop(1, "#8a6424"); g.fillStyle = "#4a3410"; g.fillRect(0, 0, 320, 120); g.fillStyle = gr; g.fillRect(6, 6, 308, 108); g.fillStyle = "#3a2a10"; g.font = "900 52px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("TAX MAN", 160, 64); g.fillStyle = "#5a4216"; for (const x of [22, 298]) { g.beginPath(); g.arc(x, 60, 7, 0, Math.PI * 2); g.fill(); } });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.056), new THREE.MeshLambertMaterial({ map: pt })); pl.position.set(-14.74, 0.535, -3.9 + 0.085 + 0.003); pl.visible = false; root.add(pl); }   /* r76i: never shown - the TAX MAN plaque lives on his door only (continuity: the insert put it on the wall) */   /* r76: only in the insert (in the wides PERCIVAL showed twice, door and wall) */   /* r63: on a loaf of the MIDDLE course (on the top course the insert's top was a murky blurred band) */ rule.visible = false; root.add(rule);
  /* r76: a soft contact shadow of the rule on the loaf, down and to the right (reviewers: the rule floated with no shadow) */
  const ruleShadow = new THREE.Mesh(new THREE.PlaneGeometry(0.19, 0.15), new THREE.MeshBasicMaterial({ map: ctex("vbRuleShadow", 128, 128, (g) => { g.filter = "blur(9px)"; g.fillStyle = "rgba(30,12,6,0.62)"; g.fillRect(26, 22, 76, 82); }), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
  ruleShadow.position.set(-14.9005 + 0.007, 0.2187 + 0.05035 - 0.007, -3.9 + 0.085 + 0.0008); ruleShadow.renderOrder = 1; ruleShadow.visible = false; root.add(ruleShadow);
  /* r53: the 3-inch LIMIT as a chalk line straight across the loaf from the top of the rule (the "+2 in" bracket read as a 5-inch scale) */
  const markTex = ctex("vbGaugeMark14", 1180, 360, (g, r) => {   /* r76: a drawn chalk line, no dark outline (the outlined bar read as a white rod) */   /* r68b: the line stops at the end of the measured loaf and sits on the rule's 3 mark (it ran off the edge, half an inch high) */   /* r55: the line runs on across the next loaves like a level (on one loaf it read as a mark on it) */ g.lineCap = "round"; g.lineJoin = "round";
    const ln = () => { g.beginPath(); g.moveTo(10, 250); g.lineTo(824, 247); };
    for (let pass = 0; pass < 4; pass++) { g.strokeStyle = `rgba(214,40,30,${0.55 + pass * 0.1})`; g.lineWidth = 15 + r() * 4;   /* r76b: a bold red chalk bar (the white hairline could not be read) */ g.beginPath(); g.moveTo(10, 250 + (r() - 0.5) * 3); for (let x = 60; x <= 790; x += 50) g.lineTo(x, 250 - x * 0.004 + (r() - 0.5) * 2.6); g.lineTo(792, 247); g.stroke(); }   /* r76d: stops at the loaf's end */
    /* r76i: no red tint over the loaf (it read as a translucent UI slab) */   /* r76e: the part of the loaf over the limit tinted red, no dimension-line end ticks (it read as a width) */
    for (const x0 of [] as number[]) { g.strokeStyle = "rgba(214,40,30,0.9)"; g.lineWidth = 12; g.beginPath(); g.moveTo(x0, 226); g.lineTo(x0 + 2, 274); g.stroke(); }
    g.font = "italic 900 86px Georgia, serif"; g.textAlign = "left"; g.textBaseline = "middle"; g.fillStyle = "rgba(40,24,18,0.72)"; g.fillRect(430, 104, 372, 120); g.lineWidth = 6; g.strokeStyle = "rgba(20,10,6,0.6)"; g.strokeText("3 in limit", 446, 165); g.fillStyle = "rgba(255,252,240,1)"; g.fillText("3 in limit", 446, 165);   /* r76i: the label inside the one loaf (it ran across the joint) */   /* r76i (reviewer): bigger, white on a dark chalk board (red on orange was unreadable) */   /* r64: smaller, inside the insert (it ran off the right edge) */   /* r62: right, clear of the stamp */
    /* r54: chalk, not print: rub out flecks and drag the strokes (reviewers: "floating serif UI text over a clean white bar") */
    g.globalCompositeOperation = "destination-out"; for (let i = 0; i < 5000; i++) { const x = r() * 1180, y = 70 + r() * 220; g.fillStyle = `rgba(0,0,0,${0.25 + r() * 0.6})`; g.fillRect(x, y, 1 + r() * 3, 1 + r() * 2); }
    for (let i = 0; i < 40; i++) { const y = 70 + r() * 220; g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(0, y, 1180, 1); } g.globalCompositeOperation = "source-over"; });
  const ruleMark = new THREE.Mesh(new THREE.PlaneGeometry(0.4187, 0.1277), new THREE.MeshLambertMaterial({ map: markTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  ruleMark.position.set(-14.7293, 0.3399, -3.9 + 0.085 + 0.0015); ruleMark.visible = false; ruleMark.renderOrder = 2; root.add(ruleMark);
  /* r76f: a low raking key across the insert wall from the left (flat light hid the loaf relief and the rule cast nothing) */ const insKey = new THREE.SpotLight("#ffe0c0", 0, 2.2, 0.55, 0.7, 1.4); insKey.position.set(-15.45, 0.42, -3.62); insKey.target.position.set(-14.75, 0.31, -3.815); insKey.castShadow = true; insKey.shadow.mapSize.set(1024, 1024); insKey.shadow.bias = -0.0005; root.add(insKey); root.add(insKey.target);
  /* r43: a soft warm fill on the insert (the wall face sat in the raking sunset's shade: the insert measured 69) */ const ruleFill = new THREE.PointLight("#ffd2a0", 0, 1.6, 1.5); ruleFill.position.set(-14.55, 0.75, -3.25); root.add(ruleFill);
  // window boxes of flowers (spring) on several houses
  const flowers = new THREE.Group(); root.add(flowers);
  { const fm = mat("vbFlowerM", () => new THREE.MeshLambertMaterial({ map: flowerTex(), alphaTest: 0.5, side: THREE.DoubleSide })); for (const [x, y, z] of [[-9.6, 1.05, -4.25], [9.4, 1.05, -4.25], [24.0, 1.05, -4.25], [-5.2, 1.05, 4.25], [13.4, 1.05, 4.25], [-21.9, 1.0, -4.75], [-18.725, 0.98, -4.72], [-14.875, 0.98, -4.72]] as V3[]   /* r76b: window boxes on the taxman's new front (reviewers: a bare box facade) */) { const s = z > 0 ? -1 : 1; const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.2), lam("vbBox", () => ({ color: "#5a3a24" }))); box.position.set(x, y, z + s * 0.1); flowers.add(box); const f = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.4), fm); f.position.set(x, y + 0.22, z + s * 0.12); flowers.add(f); } }
  const posts = [-11, 0, 12, 24].map((x) => lamp(root, [x, 2.6, 3.55], "#ffcf8a", 0, 6, "post"));
  // r20: dressing in the two blank walls the reviewers saw: the side of the house behind Ned's site (x 21) and the
  // east corner of the taxman's new house (x -13.6): a ladder, a water butt and a downpipe; ivy up the taxman's side wall
  { const pipeM = lam("vbPipe", () => ({ color: "#3e4248" })), ladM = lam("vbLadder", () => ({ map: beamHD(), color: "#b08a5e" }));
    { const lg = new THREE.Group(); lg.position.set(20.55, 0, -7.2); root.add(lg); const lb = new Batch(), h = 3.2;
      for (const sd of [-0.22, 0.22]) lb.add(bx(0.05, h, 0.05).translate(sd, h / 2, 0), ladM); for (let y = 0.3; y < h - 0.1; y += 0.3) lb.add(bx(0.44, 0.035, 0.035).translate(0, y, 0), ladM);
      lb.build(lg); lg.rotation.set(0, Math.PI / 2, -0.14, "ZYX"); }
    barrel(root, [20.58, 0, -6.05], 0.36, 0.4);
    b.add(new THREE.CylinderGeometry(0.045, 0.045, 5.4, 8).translate(20.94, 2.7, -4.48), pipeM); b.add(bx(0.16, 0.18, 0.16).translate(20.94, 5.45, -4.48), pipeM);
    barrel(root, [-13.15, 0, -5.5], 0.4, 0.8);
    const ivyM = lam("vbIvy", () => ({ map: leafCut("ivy", "#3e7a34", "#5a9a44", "#2a5a26"), alphaTest: 0.5, side: THREE.DoubleSide } as THREE.MeshLambertMaterialParameters));
    const ir = rng(91); for (let i = 0; i < 9; i++) { const zz = -5.6 - ir() * 1.8, yy = 0.3 + ir() * 2.4 - (zz + 5.6) * 0.2, sz = 0.6 + ir() * 0.5; b.add(new THREE.PlaneGeometry(sz, sz * 1.1).rotateY(Math.PI / 2).translate(-13.57 + i * 0.002, Math.max(sz * 0.5, yy), zz), ivyM); }
  }
  // barrels, sacks, a bench, a water pump in the street
  barrel(root, [-6.9, 0, -4.0], 0.42); crate(b, root, [-6.2, 0, -4.05], 0.6, "APPLES", 0.2, { seed: 3 }); crate(b, root, [8.3, 0, 3.95], 0.55, undefined, -0.3, { seed: 5 }); barrel(root, [12.2, 0, -4.0], 0.4, 0.3); barrel(root, [10.8, 0, 3.9], 0.4, 0.5); sack(root, [11.5, 0, 3.95], 0.34); sack(root, [7.4, 0, -4.05], 0.32, "#bfa070");
  b.add(bx(1.6, 0.06, 0.38).translate(-1.4, 0.45, -3.95), plank); for (const x of [-2.0, -0.8]) b.add(bx(0.06, 0.45, 0.32).translate(x, 0.22, -3.95), timber);
  { const pump = new THREE.Group(); pump.position.set(-14, 0, 3.6); root.add(pump); const iron = lam("vbIron", () => ({ color: "#2e2a30" })); pump.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 1.3, 10).translate(0, 0.65, 0), iron)); pump.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.5).rotateX(0.5).translate(0, 1.2, 0.25), iron)); pump.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.4).translate(0, 0.17, -0.1), lam("vbTrough", () => ({ map: stoneHD("vbTroughT") })))); }
  // trees along the lane + behind the houses; the church at the east end; hills
  const barkM = lam("byBarkM", () => ({ map: barkTex() }));
  const leafM = swayMaterial(mat("vbLeafMS3", () => new THREE.MeshLambertMaterial({ color: "#64a24a", vertexColors: true })   /* r76i (all reviewers): smooth painted clumps with the canopy shade only (the leaf texture read as noise-dotted blobs) */));   /* r53: solid clumps */
  const coreM = swayMaterial(lam("byCore2", () => ({ color: "#3e7034", emissive: "#14300e" })));
  /* r68: the west lane trees cast no shadow (their crowns threw blob shadows and orange gaps across the house of loaves) */ const bw = new Batch(), westT = new THREE.Group(); root.add(westT);
  for (const [x, z, h, s] of [[-38, -12, 8, 12], [-9.4, -8.6, 6.5, 2], [-28, 6, 7.5, 3], [-36, -2, 9, 4], [6, -16, 9, 5], [23, -16, 8, 6], [-4, 15, 8.5, 7], [28, 15, 8, 8], [44, -6, 9, 9]] as [number, number, number, number][]) leafyTree(x < -20 ? bw : b, root, [x, 0, z], h, s, leafM, coreM, barkM, 16, leafCardMat("vbLeafCardM"));   /* r59: the tree beside the taxman's house moved off (its canopy threw a big blob shadow across the front) */
  // r13: the far west horizon of Church Lane gets rooftops and trees (the crane-top wide ended on a flat field)
  house(bw, -46, -9, 0.4, 7, 6, 5, 2, 0); house(bw, -52, 4, -0.3, 6, 6, 4.6, 5, 0); house(bw, -40, 12, 0.2, 6.5, 6, 5.2, 1, 0);   /* r74: the far west houses cast no shadow (with the low raking sun they put the whole lower front and the pair in shade) */
  for (const [x, z, h, sd] of [[-44, -2, 8, 31], [-50, -16, 9, 32], [-38, 6, 7, 33]] as [number, number, number, number][]) leafyTree(bw, root, [x, 0, z], h, sd, leafM, coreM, barkM, 14, leafCardMat("vbLeafCardM"));
  const blossom = new THREE.Group(); root.add(blossom);
  { const bb = new Batch(); const blM = swayMaterial(mat("byBlossomMS2", () => new THREE.MeshLambertMaterial({ map: blossomSolid(), vertexColors: true }))); leafyTree(bb, blossom, [10.0, 0, -9.0], 5.4, 12,   /* r60: out of Ned's site frame (its canopy was a purple smear at the top-left) */ blM, lam("byBlCore", () => ({ color: "#d8a8b8" })), barkM, 14); leafyTree(bb, blossom, [-13.0, 0, -9.0], 5.0, 13, blM, lam("byBlCore", () => ({ color: "#d8a8b8" })), barkM, 14); bb.build(blossom); }
  { const ch = lam("vbChurch", () => ({ map: rep(stoneHD("vbChurchS"), 2, 4) })); b.add(bx(6, 7, 12).translate(46, 3.5, 0), ch); b.add(bx(3.4, 13, 3.4).translate(41.4, 6.5, 0), ch); b.add(new THREE.ConeGeometry(2.3, 8, 4).rotateY(Math.PI / 4).translate(41.4, 17, 0), lam("vbSpire", () => ({ color: "#6a7a8a" }))); const roofG = new THREE.CylinderGeometry(0.01, 4.3, 3, 4, 1).rotateY(Math.PI / 4).scale(0.75, 1, 1.45).translate(46, 8.5, 0); b.add(roofG, lam("vbRoof#6a7480", () => ({ map: roofHD("#6a7480"), side: THREE.DoubleSide }))); }
  { const hedge = swayMaterial(mat("vbHedgeMS", () => new THREE.MeshLambertMaterial({ map: leafSolid("hedge", "#4f8a3a", "#82b45a", "#3a6a30") })));   /* r56: solid clumps (the cut-out hedge read as green noise) */
    { const hf = leafCardMat("vbHedgeCardM"), hr = rng(78); for (const z of [-24, -36, -52]) for (let x = -70; x < 70; x += 1.8) { b.add(smoothIco(1.1).scale(1.2, 0.75, 0.9).translate(x, 0.55, z + Math.sin(x * 0.7) * 0.6), hedge); if (z === -24) leafFringe(b, V(x, 0.57, z + Math.sin(x * 0.7) * 0.6), 1.05, 12, hf, hr, 0.55, 1.0, 0.95); } }   /* r76i: leaf sprays on the near hedge */
    for (const [x, z, h, sd] of [[-30, -30, 8, 21], [-8, -40, 9, 22], [12, -30, 7, 23], [30, -44, 9, 24], [-45, -46, 8, 25], [48, -28, 7, 26]] as [number, number, number, number][]) leafyTree(b, root, [x, 0, z], h, sd, leafM, coreM, barkM, 14, leafCardMat("vbLeafCardM"));
    house(b, -18, -60, 0.3, 8, 6, 5, 3, 0); house(b, 22, -66, -0.2, 7, 6, 4.6, 6, 0); }
  b.build(root);
  root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !m.layers.isEnabled(NOINK)) { m.receiveShadow = true; if (!(m.material as THREE.Material).transparent) m.castShadow = true; } });
  bw.build(westT, false); westT.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = false; m.userData.noCast = true; } });
  const cart = handcart(root, firedA[0], timber, plank); cart.rotation.y = 0;   /* r26: the loaves on the cart show the A */ cart.position.set(-10, 0, 1.0);
  void loafTop; void sm; void facadeHD; void taxHouse;
  const marks: Record<string, V3> = {
    amosCart: [-8.6, 0, 1.0], baker: [5.4, 0, -3.7], v1: [-4.2, 0, -3.8], v2: [-2.4, 0, 3.8], v3: [1.4, 0, -3.8], v4: [7.6, 0, 3.8], v5: [9.6, 0, -3.8], kid: [3.0, 0, 3.2],
    ned: [16.2, 0, -5.4], nedMug: [15.4, 0, -4.4], silasSt: [-6.0, 0, 3.6],
    tax: [-16.0, 0, -3.3], taxDoor: [-16.8, 0, -4.4], amosLane: [-19.6, 0, -2.6], neighbour: [-22.4, 0, -3.3],
  };
  const cams: SetDef["cams"] = {
    street: { pos: [-14, 1.7, 0.2], look: [0, 1.6, 0], fov: 52 },
    bakery: { pos: [1.2, 1.5, 1.8], look: [4.2, 1.6, -4.2], fov: 50 },
    plot: { pos: [16.2, 1.5, -1.2], look: [16.6, 1.2, -6.0], fov: 50 },
    lane: { pos: [-19.6, 1.6, 4.2], look: [-18.8, 3.0, -5.0], fov: 54 },
  };
  return {
    name: "village", root, marks, cams, title: courses,
    pose: (t, c) => {
      const ck = c.cart ?? 0; cart.position.set(c.cartX ?? -10 + ck * 20, 0, c.cartZ ?? 1.0); cart.rotation.y = c.cartRot ?? 0; cart.rotation.z = c.cartTilt ?? 0;   /* r46: tipped up on its wheels when pulled */ (cart.userData.wheels as THREE.Group[]).forEach((w) => { w.rotation.z = -ck * 50; });
      const nC = (c.wallH ?? 1) * courses.length; courses.forEach((g, i) => { const a = cl(nC - i); g.visible = a > 0.15; g.position.y = i * 0.215 + (1 - sm(a)) * 0.05; });
      const tea = c.tea ?? 0; steam.forEach((s, i) => { const u = (t * 0.45 + i / 4) % 1; (s.material as THREE.SpriteMaterial).opacity = 0.8 * tea *   /* r76b: the steam reads in the site medium */ Math.min(1, u * 8) * Math.pow(1 - u, 0.7); s.position.set(VIL.MUG[0] + Math.sin(t * 2 + i) * 0.02 * u + u * 0.04, VIL.MUG[1] + 0.13 + u * 0.36, VIL.MUG[2]); s.scale.set(0.06 + u * 0.24, (0.06 + u * 0.24) * 0.8, 1); });
      flowers.visible = (c.spring ?? 0) > 0; siteDress.visible = (c.spring ?? 0) > 0; blossom.visible = (c.spring ?? 0) > 0;
      stick.visible = (c.stick ?? 1) > 0; rule.visible = (c.rule ?? 0) > 0; ruleFill.intensity = (c.rule ?? 0) > 0 ? 0.15 : 0; ruleShadow.visible = (c.rule ?? 0) > 0; insKey.intensity = (c.rule ?? 0) > 0 ? 5 : 0; ruleRefs.forEach((o) => { o.visible = (c.rule ?? 0) > 0; });   /* r76: less fill (the insert clipped) */ ruleMark.visible = rule.visible; (ruleMark.material as THREE.MeshLambertMaterial).opacity = Math.min(1, Math.max(0, 1 - (c.ruleTilt ?? 0) / 0.1)); pile.visible = (c.pile ?? 0) > 0; rule.rotation.z = c.ruleTilt ?? 0;
      const lo = c.lamps ?? 0; posts.forEach((l) => { (l.userData.light as THREE.PointLight).intensity = lo * 5; (l.userData.glow as THREE.Sprite).visible = lo > 0; l.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial; if (m && m.type === "MeshBasicMaterial" && !o.userData.on) o.userData.on = m.color.clone(); if (o.userData.on) m.color.copy(o.userData.on).multiplyScalar(lo > 0 ? 1 : 0.12); }); });
      (signG.userData.sg as THREE.Group).rotation.x = Math.sin(t * 1.3) * 0.06;
    },
  };
};
