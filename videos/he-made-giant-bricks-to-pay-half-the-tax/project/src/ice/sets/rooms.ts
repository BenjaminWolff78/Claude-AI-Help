// "He Made Giant Bricks to Pay Half the Tax": two interiors.
// office (scene 6, summer night): the excise office. Room x -2.6..2.6, z -2.2..2.2, ceiling 2.8. Back wall (z -2.2):
// a sash window with the moon, shelves of ledgers, the royal arms plaque. The desk at (0, 0, -0.75) faces +z: the big
// ledger open on it (left page 1784 full, right page 1785 filling then half empty: c.ledger 0..1), a candle (c.candle),
// inkwell + quill, two coin stacks (c.coins 0..1 shrinks the 1785 stack to half), a strongbox. The taxman sits behind
// the desk (mark "tax"), facing +z.
// inn (scene 8, evening): the Plough inn. Room x -4.2..4.2, z -3.2..3.2, ceiling 3.0 on beams. Bar counter along the
// back (z -2.1, x -2.6..2.2) with tankards on shelves and a chalkboard "ALE 1d A MUG"; the fireplace on the left wall
// (x -4.2); tables + benches; the door on the right wall (x 4.2, z 0.6..1.8, c.door 0..1 opens it onto the lane at
// sunset); the notice post by the door (c.act 0..1: the Act of Parliament notice is pinned up); the law book on the
// counter (c.book 0..1 opens it); the giant tankard (c.bigMug 0..1 grows it from a normal mug, at mark "bigMug").
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../build";
import { ctex, rng, rep, beamHD, planksHD, stoneHD } from "../paint";
import { NOINK } from "../ink";
import { lamp, flicker, glow, mist, barrel } from "../setkit";
import { coinTex, leafCut } from "./brickyard";
import type { SetDef, V3 } from "./types";

const TAU = Math.PI * 2;
const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const blot = (g: CanvasRenderingContext2D, x: number, y: number, rad: number, rgba: string) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba); gr.addColorStop(1, rgba.replace(/[\d.]+\)$/, "0)")); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
const bx = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
// r13: rougher plaster - trowel grain, stronger patches, a few flaked spots showing brick
const plaster = (key: string, base: string) => ctex(key, 512, 512, (g, r) => { g.fillStyle = base; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 70; i++) blot(g, r() * 512, r() * 512, 30 + r() * 90, r() < 0.5 ? "rgba(255,250,236,0.2)" : "rgba(110,86,60,0.16)"); { const gr = g.createLinearGradient(0, 380, 0, 512); gr.addColorStop(0, "rgba(90,70,50,0)"); gr.addColorStop(1, "rgba(90,70,50,0.22)"); g.fillStyle = gr; g.fillRect(0, 380, 512, 132); } for (let i = 0; i < 9000; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.1)" : "rgba(80,60,40,0.1)"; g.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2); } for (let i = 0; i < 0; i++) { const x = r() * 480, y = 60 + r() * 400; g.fillStyle = "rgba(132,96,76,0.4)"; g.beginPath(); g.ellipse(x, y, 14 + r() * 22, 8 + r() * 12, r(), 0, 6.3); g.fill(); g.strokeStyle = "rgba(255,250,236,0.4)"; g.lineWidth = 1.5; g.stroke(); } for (let i = 0; i < 5; i++) { let x = r() * 512, y = r() * 400; g.strokeStyle = "rgba(110,90,70,0.3)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 30; y += 10 + r() * 20; g.lineTo(x, y); } g.stroke(); } });

/** the ledger spread: left page 1784 (10 full rows), right page 1785 (rows appear with fill, and by summer only 5 of 10
 *  are there, total half). n = number of rows on the right page (0..10), tot = whether the totals are written. */
/** the ledger spread: left page 1784 (6 full rows, TOTAL £60), right page 1785 (n rows of 6; by summer only 3, and
 *  the total £30 written under them: tot). Big type: it has to read on a phone. */
const ledgerTex = (n: number, tot: boolean) => ctex(`rmLedger4_${n}_${tot}`, 1024, 640, (g, r) => {
  g.fillStyle = "#e6d2a8"; g.fillRect(0, 0, 1024, 640); for (let i = 0; i < 70; i++) blot(g, r() * 1024, r() * 640, 30 + r() * 90, "rgba(160,118,64,0.1)");   /* r60: old rag paper, foxed edges (it read as blank white pages) */
  { const ed = g.createRadialGradient(512, 320, 260, 512, 320, 620); ed.addColorStop(0, "rgba(120,80,30,0)"); ed.addColorStop(1, "rgba(120,80,30,0.32)"); g.fillStyle = ed; g.fillRect(0, 0, 1024, 640); }
  const gut = g.createLinearGradient(482, 0, 542, 0); gut.addColorStop(0, "rgba(0,0,0,0)"); gut.addColorStop(0.5, "rgba(90,60,30,0.35)"); gut.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gut; g.fillRect(482, 0, 60, 640);
  const page = (x0: number, year: string, rows: number, total: string) => {
    g.fillStyle = "#7a2a1e"; g.font = "900 80px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(year, x0 + 236, 46);
    g.strokeStyle = "rgba(60,90,150,0.5)"; g.lineWidth = 3; for (let k = 0; k < 7; k++) { const y = 92 + k * 58; g.beginPath(); g.moveTo(x0 + 24, y); g.lineTo(x0 + 450, y); g.stroke(); }
    g.strokeStyle = "rgba(160,40,40,0.55)"; g.beginPath(); g.moveTo(x0 + 310, 80); g.lineTo(x0 + 310, 444); g.stroke();
    for (let k = 0; k < rows; k++) { const y = 92 + k * 58 + 30; g.fillStyle = "rgba(42,32,24,0.8)"; for (let q = 0; q < 5; q++) { if (q === 4) { g.save(); g.translate(x0 + 120, y); g.rotate(-0.9); g.fillRect(-62, -4, 124, 9); g.restore(); } else g.fillRect(x0 + 56 + q * 32, y - 26, 10, 52); } g.fillStyle = "#2a2018"; g.font = "italic 900 62px Georgia, serif"; g.textAlign = "right"; g.fillText("£10", x0 + 446, y + 2); }
    if (total) { g.strokeStyle = "#2a2018"; g.lineWidth = 5; g.beginPath(); g.moveTo(x0 + 250, 462); g.lineTo(x0 + 450, 462); g.stroke(); g.fillStyle = "#7a2a1e"; g.font = "900 104px Georgia, serif"; g.textAlign = "right"; g.fillText(total, x0 + 450, 520); g.textAlign = "left"; g.font = "900 52px Georgia, serif"; g.fillText("TOTAL", x0 + 30, 520); }
  };
  page(18, "1784", 6, "£60"); page(530, "1785", n, tot ? "£30" : "");
});
const armsTex = () => ctex("rmArms", 384, 384, (g) => {
  g.fillStyle = "#b8322a"; g.beginPath(); g.moveTo(72, 70); g.lineTo(312, 70); g.lineTo(312, 220); g.quadraticCurveTo(312, 320, 192, 350); g.quadraticCurveTo(72, 320, 72, 220); g.closePath(); g.fill(); g.strokeStyle = "#e8b84a"; g.lineWidth = 12; g.stroke();
  g.fillStyle = "#e8b84a"; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(132 + k * 30, 60); g.lineTo(147 + k * 30, 22); g.lineTo(162 + k * 30, 60); g.fill(); }
  g.fillStyle = "#f6e2a8"; g.font = "italic 900 120px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("GR", 192, 200);
});
/* r76i (reviewer: "a flat navy card with black cut-out roofs"): a painted night town - a moonlit sky with soft cloud bands,
 * two layers of roofs (far ones misty blue, near ones dark with chimneys, smoke and warm lit windows) */
const nightWin = () => ctex("rmNightWin2", 512, 768, (g, r) => { const gr = g.createLinearGradient(0, 0, 0, 768); gr.addColorStop(0, "#101a4a"); gr.addColorStop(0.55, "#2c4690"); gr.addColorStop(1, "#5a74b8"); g.fillStyle = gr; g.fillRect(0, 0, 512, 768);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,240,${0.4 + r() * 0.5})`; const s2 = 1 + r() * 2.5; g.fillRect(r() * 512, r() * 420, s2, s2); }
  g.fillStyle = "rgba(244,240,220,0.18)"; g.beginPath(); g.arc(356, 184, 120, 0, TAU); g.fill(); g.fillStyle = "#f6f2de"; g.beginPath(); g.arc(356, 184, 64, 0, TAU); g.fill(); g.fillStyle = "rgba(200,196,170,0.5)"; for (const [x, y, rr] of [[338, 170, 12], [376, 204, 9], [350, 214, 6]]) { g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); }
  for (let k = 0; k < 4; k++) { const y = 120 + k * 90 + r() * 30, x = r() * 300 - 100; g.fillStyle = "rgba(150,170,220,0.16)"; g.beginPath(); g.ellipse(x + 200, y, 200 + r() * 80, 18 + r() * 10, 0, 0, TAU); g.fill(); }
  const roofRow = (base: number, hMin: number, hVar: number, col: string, lit: boolean) => { for (let x = -30; x < 540;) { const w = 70 + r() * 60, h = hMin + r() * hVar, top = base - h; g.fillStyle = col; g.fillRect(x, top, w, 800 - top); g.beginPath(); g.moveTo(x - 8, top); g.lineTo(x + w / 2, top - 30 - r() * 26); g.lineTo(x + w + 8, top); g.fill();
      if (r() < 0.6) { const cx = x + w * (0.2 + r() * 0.6); g.fillRect(cx, top - 50, 12, 40); if (lit) { g.fillStyle = "rgba(200,210,235,0.22)"; for (let q = 0; q < 5; q++) { g.beginPath(); g.arc(cx + 6 + q * 9 + r() * 6, top - 64 - q * 18, 9 + q * 3, 0, TAU); g.fill(); } g.fillStyle = col; } }
      if (lit) for (let q = 0; q < 3; q++) if (r() < 0.55) { const wx = x + 10 + r() * (w - 30), wy = top + 20 + r() * 50; g.fillStyle = "#ffcf7a"; g.fillRect(wx, wy, 14, 18); g.fillStyle = "rgba(255,200,110,0.25)"; g.fillRect(wx - 6, wy - 6, 26, 30); g.fillStyle = "#3a2a1a"; g.fillRect(wx + 6, wy, 2, 18); g.fillRect(wx, wy + 8, 14, 2); g.fillStyle = col; }
      x += w + 4 + r() * 10; } };
  roofRow(640, 30, 60, "#3a4a7a", false); roofRow(720, 20, 70, "#151a32", true); });
const sunsetWin = () => ctex("rmSunsetDoor", 256, 512, (g, r) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#6a8ad0"); gr.addColorStop(0.45, "#f8b878"); gr.addColorStop(0.7, "#ffd8a0"); gr.addColorStop(1, "#c8a070"); g.fillStyle = gr; g.fillRect(0, 0, 256, 512); g.fillStyle = "#b45a3c"; g.fillRect(20, 300, 216, 212); g.fillStyle = "#7a3a2a"; g.beginPath(); g.moveTo(0, 300); g.lineTo(128, 220); g.lineTo(256, 300); g.fill(); for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(255,255,255,0.08)"; g.fillRect(20, 300 + i * 7, 216, 2); } });
const chalkTex = () => ctex("rmChalk", 768, 512, (g, r) => { g.fillStyle = "#2c3430"; g.fillRect(0, 0, 768, 512); for (let i = 0; i < 40; i++) blot(g, r() * 768, r() * 512, 30 + r() * 90, "rgba(240,240,230,0.05)"); g.strokeStyle = "#7a5634"; g.lineWidth = 28; g.strokeRect(14, 14, 740, 484); g.fillStyle = "#f4f2ea"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 150px Georgia, serif"; g.fillText("ALE", 384, 160); g.font = "900 104px Georgia, serif"; g.fillStyle = "#f6d070"; g.fillText("1d A MUG", 384, 330); g.strokeStyle = "#f4f2ea"; g.lineWidth = 5; g.beginPath(); g.moveTo(170, 420); g.lineTo(598, 420); g.stroke(); });
const actTex = () => ctex("rmAct", 512, 704, (g, r) => { g.fillStyle = "#f2e6c8"; g.fillRect(0, 0, 512, 704); for (let i = 0; i < 30; i++) blot(g, r() * 512, r() * 704, 30 + r() * 70, "rgba(170,130,80,0.1)"); g.fillStyle = "#b8322a"; g.font = "italic 900 74px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("GR", 256, 70); g.fillStyle = "#2a1a10"; g.font = "900 46px Georgia, serif"; g.fillText("ACT OF", 256, 150); g.fillText("PARLIAMENT", 256, 202); g.strokeStyle = "#2a1a10"; g.lineWidth = 4; g.beginPath(); g.moveTo(60, 240); g.lineTo(452, 240); g.stroke(); g.font = "900 54px Georgia, serif"; g.fillText("BRICKS", 256, 300); g.fillText("OVER 3 INCHES", 256, 368); g.fillText("TALL", 256, 432); g.fillStyle = "#b8322a"; g.font = "900 84px Georgia, serif"; g.fillText("PAY", 256, 528); g.fillText("DOUBLE", 256, 612); });
const bookTex = () => ctex("rmLawBook", 1024, 640, (g, r) => { g.fillStyle = "#f0e2c0"; g.fillRect(0, 0, 1024, 640); const gut = g.createLinearGradient(482, 0, 542, 0); gut.addColorStop(0, "rgba(0,0,0,0)"); gut.addColorStop(0.5, "rgba(90,60,30,0.35)"); gut.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gut; g.fillRect(482, 0, 60, 640); g.fillStyle = "#2a1a10"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 50px Georgia, serif"; g.fillText("EXCISE ACTS", 256, 70); g.font = "900 64px Georgia, serif"; g.fillText("BRICKS:", 256, 220); g.fillStyle = "#7a2a1e"; g.font = "900 72px Georgia, serif"; g.fillText("2s 6d", 256, 330); g.fillStyle = "#2a1a10"; g.font = "900 50px Georgia, serif"; g.fillText("per 1000", 256, 420); g.font = "italic 900 46px Georgia, serif"; g.fillStyle = "#4a3a2a"; g.fillText("SIZE:", 768, 220); g.strokeStyle = "rgba(60,90,150,0.45)"; g.lineWidth = 3; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(580, 290 + k * 50); g.lineTo(956, 290 + k * 50); g.stroke(); } for (let i = 0; i < 18; i++) { g.fillStyle = "rgba(42,26,16,0.22)"; g.fillRect(40 + r() * 400, 480 + r() * 120, 60 + r() * 120, 6); } });

export const OFFICE = { DESK: [0, 0, -0.75] as V3, TOP: 0.82, LEDGER: [0, 1.0, -0.98] as V3, SLOPE: 0.55 };   // r26: a sloped stand (the flat ledger sat under the caption)   // r25: further back on the desk so it sits above the caption band
export const office = (): SetDef => {
  const root = new THREE.Group(), b = new Batch();
  const wall = lam("rmOfWall3", () => ({ map: plaster("rmOfWallT3", "#5e6066") })),   /* r57: a cool grey plaster that goes blue at night (beige read as a warm afternoon) */   /* r53: a darker plaster (the cream wall read as a day office at night) */ wood = lam("rmOfWood2", () => ({ map: planksHD(), color: "#ac7c4c" })), beam = lam("rmOfBeam", () => ({ map: beamHD(), color: "#8a6644" }));
  const floor = lam("rmOfFloor", () => ({ map: rep(planksHD(), 1, 1), color: "#8a6a4a" }));
  b.add(quad(V(-2.6, 0, 2.2), V(2.6, 0, 2.2), V(2.6, 0, -2.2), V(-2.6, 0, -2.2), 2, 2), floor);
  b.add(boxGeo(V(-2.9, 0, -2.5), V(2.9, 2.8, -2.2), 1), wall); b.add(boxGeo(V(-2.9, 0, -2.5), V(-2.6, 2.8, 2.5), 1), wall); b.add(boxGeo(V(2.6, 0, -2.5), V(2.9, 2.8, 2.5), 1), wall); b.add(boxGeo(V(-2.9, 0, 2.2), V(2.9, 2.8, 2.5), 1), wall);
  b.add(boxGeo(V(-2.9, 2.8, -2.5), V(2.9, 2.9, 2.5), 1, true), wood); for (const x of [-1.3, 1.3]) b.add(boxGeo(V(x - 0.12, 2.58, -2.2), V(x + 0.12, 2.8, 2.2), 1, true), beam);
  b.add(boxGeo(V(-2.6, 0, -2.2), V(2.6, 0.95, -2.16), 1), wood); b.add(boxGeo(V(-2.6, 0.93, -2.2), V(2.6, 0.99, -2.12), 1), beam);
  // window with the moon (back wall, right of centre), shutters
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.3), new THREE.MeshBasicMaterial({ map: nightWin(), toneMapped: true })); win.position.set(1.05, 1.75, -2.155);   /* r63: a step left so the moonlit window shows in the desk shot (reviewers: the office never read as night) */ root.add(win);
  for (const [x0, x1, y0, y1] of [[0.55, 0.6, 1.1, 2.4], [1.5, 1.55, 1.1, 2.4], [0.55, 1.55, 2.4, 2.46], [0.5, 1.6, 1.04, 1.1], [1.02, 1.08, 1.1, 2.4], [0.55, 1.55, 1.72, 1.78]] as const) b.add(boxGeo(V(x0, y0, -2.16), V(x1, y1, -2.1)), lam("rmFrame", () => ({ color: "#efe6d2" })));
  const moon = new THREE.SpotLight("#8aa4ff", 4.5, 8, 0.5, 0.7, 1.2);   /* r51: a darker night office (it measured 142, lit like day) */ moon.position.set(1.05, 2.2, -2.6); moon.target.position.set(0.2, 1.1, -1.3); root.add(moon, moon.target);
  // shelves of ledgers (left of the window), the royal arms (above the desk)
  const spineCols = ["#6a2a22", "#2a3a5a", "#3a4a2a", "#5a3a22", "#4a2a3a", "#7a5a2a", "#22384a", "#5a2424", "#3e3428", "#6a4a3a"];   // r12: ten bindings, three label styles
  const spineMat = (k: number) => lam("rmSpineB" + k, () => ({ map: ctex("rmSpineT" + k, 32, 128, (g, rr) => { g.fillStyle = spineCols[k % 10]; g.fillRect(0, 0, 32, 128); g.fillStyle = "rgba(255,255,255,0.08)"; g.fillRect(0, 0, 8, 128); g.fillStyle = "rgba(0,0,0,0.18)"; g.fillRect(26, 0, 6, 128);
    for (let i = 0; i < 30; i++) { g.fillStyle = rr() < 0.5 ? "rgba(0,0,0,0.12)" : "rgba(255,240,220,0.08)"; g.fillRect(rr() * 32, rr() * 128, 2, 1 + rr() * 4); }
    const st = k % 3; g.fillStyle = "#c8a24a";
    if (st === 0) { for (const y of [10, 16, 108, 114]) g.fillRect(0, y, 32, 3); g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(6, 44, 20, 30); g.fillStyle = "#d8b860"; g.fillRect(9, 52, 14, 2); g.fillRect(9, 60, 10, 2); }
    else if (st === 1) { for (const y of [22, 30, 98]) g.fillRect(0, y, 32, 2); g.fillStyle = "#efe2c0"; g.fillRect(7, 56, 18, 22); g.fillStyle = "#4a3a2a"; g.fillRect(10, 62, 12, 2); g.fillRect(10, 68, 9, 2); }
    else { g.fillRect(0, 6, 32, 5); g.fillRect(0, 117, 32, 5); g.fillStyle = "rgba(200,160,80,0.8)"; g.beginPath(); g.arc(16, 64, 6, 0, Math.PI * 2); g.fill(); } }) }));
  for (const y of [1.15, 1.6, 2.05]) { b.add(boxGeo(V(-2.2, y, -2.2), V(0.2, y + 0.04, -1.9)), wood); const r = rng(Math.round(y * 10)); for (let x = -2.15; x < 0.1;) { const w = 0.045 + r() * 0.08, h = 0.22 + r() * 0.2, gap = r() < 0.12 ? 0.04 + r() * 0.06 : 0; if (x + w > 0.1) break; b.add(boxGeo(V(x, y + 0.04, -2.15 + r() * 0.03), V(x + w - 0.008, y + 0.04 + h, -1.92 - r() * 0.02)), spineMat(Math.floor(r() * 10))); x += w + gap; } }
  const arms = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshBasicMaterial({ map: armsTex(), transparent: true, toneMapped: true })); arms.position.set(-0.95, 2.4, -1.88); root.add(arms);
  // the desk + the taxman's chair; the ledger; candle; inkwell + quill; coins; strongbox
  b.add(boxGeo(V(-1.0, 0.76, -1.15), V(1.0, 0.82, -0.25)), wood); for (const x of [-0.92, 0.92]) b.add(boxGeo(V(x - 0.06, 0, -1.1), V(x + 0.06, 0.76, -0.3)), beam);
  b.add(boxGeo(V(-1.0, 0.2, -0.3), V(1.0, 0.76, -0.26)), wood);
  b.add(boxGeo(V(-0.3, 0.42, -1.75), V(0.3, 0.47, -1.35)), wood); b.add(boxGeo(V(-0.3, 0.47, -1.78), V(0.3, 1.2, -1.73)), wood); for (const [x, z] of [[-0.26, -1.4], [0.26, -1.4], [-0.26, -1.72], [0.26, -1.72]]) b.add(boxGeo(V(x - 0.03, 0, z - 0.03), V(x + 0.03, 0.42, z + 0.03)), beam);
  const ledM = new THREE.MeshBasicMaterial({ map: ledgerTex(3, true), toneMapped: true });
  const ledger = new THREE.Group(); ledger.position.set(...OFFICE.LEDGER); ledger.rotation.x = OFFICE.SLOPE; ledger.scale.setScalar(0.64); root.add(ledger);   /* r26: on a sloped clerk's stand, facing the lens above the caption band */
  { const sw = lam("rmStand", () => ({ map: planksHD(), color: "#7a5236" })); const board = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.46).translate(0, -0.03, 0), sw); board.position.copy(ledger.position); board.rotation.x = OFFICE.SLOPE; board.castShadow = true; root.add(board);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.26, 0.04), sw); back.position.set(OFFICE.LEDGER[0], 0.95, OFFICE.LEDGER[2] - 0.18); root.add(back); }   /* r24: a smaller ledger (it filled 85 % of the desk frame) */
  { const cover = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.03, 0.64), lam("rmLedCover", () => ({ color: "#5a2a1e" }))); cover.position.y = 0.015; cover.castShadow = true; ledger.add(cover);
    const pages = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.6).rotateX(-Math.PI / 2), ledM); pages.position.y = 0.034; ledger.add(pages); ledger.userData.pages = pages; }
  const candle = lamp(root, [-0.72, 0.84, -1.28], "#ffb45a", 1.2, 3.5, "table");   /* r76i (reviewer): a small warm pool, not a lit room (the night office read as orange daylight) */   /* r74: dimmer off-frame lamp - the desk candle keys the ledger and his face */   /* r68b: wholly out of the desk frame (half a lamp at the left edge read as a cut-off object) */
  /* r68b: the front of the desk dressed (reviewers: an empty lower quarter): a tax demand with inked lines and a quill across it, a stick of red sealing wax and a brass seal */
  { const pt = ctex("rmDemand", 256, 360, (g, r) => { g.fillStyle = "#ead9b4"; g.fillRect(0, 0, 256, 360); for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(150,110,60,${0.05 + r() * 0.08})`; g.beginPath(); g.arc(r() * 256, r() * 360, 8 + r() * 26, 0, 6.3); g.fill(); }
      g.fillStyle = "#3a2a1a"; g.font = "700 30px Georgia, serif"; g.textAlign = "center"; g.fillText("DEMAND", 128, 48); g.fillRect(40, 60, 176, 2);
      g.strokeStyle = "rgba(40,30,22,0.75)"; g.lineWidth = 2; for (let y = 90; y < 320; y += 20) { g.beginPath(); let x = 30; g.moveTo(x, y); while (x < 220) { x += 6 + r() * 10; g.lineTo(x, y + (r() - 0.5) * 3); } g.stroke(); }
      g.fillStyle = "#a8282a"; g.beginPath(); g.arc(200, 330, 16, 0, 6.3); g.fill(); });
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.29).rotateX(-Math.PI / 2), lam("rmDemandM", () => ({ map: pt }))); sheet.position.set(0.27, 0.823, -0.38);   /* r76i: into the corner (it sat mid-frame) */ sheet.rotation.y = -0.32; root.add(sheet);
    const quill = new THREE.Group(); quill.position.set(0.2, 0.832, -0.42); quill.rotation.y = 0.9; root.add(quill);
    { const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.002, 0.24, 6).rotateZ(Math.PI / 2), lam("rmQuillS", () => ({ color: "#e8e0cc" }))); quill.add(sh);
      const vane = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.03).translate(0.04, 0, 0).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: "#f4efe2", side: THREE.DoubleSide })); vane.position.y = 0.002; quill.add(vane); }
    const wax = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.016, 0.016), lam("rmWaxStick", () => ({ color: "#b02a26" }))); wax.position.set(0.02, 0.829, -0.34); wax.rotation.y = 0.5; root.add(wax);
    /* r73: a lit candle on the desk front - the warm source of the office light, in frame (reviewer: a night office lit like day, no lamp) */
    { const cg = new THREE.Group(); cg.position.set(0.47, 0.82, -0.92); cg.scale.setScalar(1.35); root.add(cg);   /* r76i (reviewer: no visible light source): left of the ledger, inside the frame and taller */   /* r76b: to the desk's right corner (bottom-centre it skewered the coin stack) */
      cg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.012, 18).translate(0, 0.006, 0), lam("rmCandleDish", () => ({ color: "#c8a048" }))));
      cg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.017, 0.11, 12).translate(0, 0.067, 0), lam("rmCandleWax", () => ({ color: "#f2ead2", emissive: "#3a2a10" }))));
      glow(cg, [0, 0.135, 0], "#ffd08a", 0.016, 0.5); glow(cg, [0, 0.14, 0], "#ffb45a", 0.07, 0.18);   /* r76e: only a tiny flame (the halo clipped the lower right) */   /* r76d: dimmer still (it clipped to white) */   /* r76: a small flame, not a blown white blob */
      const cl = new THREE.PointLight("#ffb45a", 2.0, 2.2, 1.6);   /* r76i: his head clipped white */   /* r76f: no hot spot on the paper */   /* r76: more warm light up onto his face */ cl.position.set(0, 0.16, 0); cg.add(cl); }
    /* r69: a squat glass inkwell instead of the brass seal (reviewer: it read as a black pawn) */
    const seal = new THREE.Group(); seal.position.set(-0.17, 0.82, -0.46); seal.visible = false; root.add(seal);   /* r73: the candle takes its place */
    { const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.036, 0.04, 16).translate(0, 0.02, 0), lam("rmInkGlass", () => ({ color: "#2a3a56", emissive: "#0c1220" }))); seal.add(gl);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.014, 12).translate(0, 0.047, 0), lam("rmInkLid", () => ({ color: "#c8a048" }))); seal.add(lid); }
    for (const m of [sheet, wax]) { m.castShadow = true; m.receiveShadow = true; } quill.traverse((o) => { (o as THREE.Mesh).castShadow = true; }); seal.traverse((o) => { (o as THREE.Mesh).castShadow = true; }); }   /* r26: left of the ledger (its bloom washed out the 1785 page) */   // r5: in frame over the desk, its pool on the ledger
  { const cm = lam("rmWax", () => ({ color: "#f2ead2" })); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.22, 12).translate(-0.62, 0.93, -0.95), cm); root.add(c); }
  const ink = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.07, 12).translate(-0.62, 0.86, -0.7), lam("rmInk", () => ({ color: "#1e2230" }))); root.add(ink);
  const quill = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.36, 6).rotateZ(-0.5).translate(-0.56, 0.98, -0.7), lam("rmQuill", () => ({ color: "#f4f0e6" }))); root.add(quill);
  const coinM = new THREE.MeshStandardMaterial({ map: coinTex(), roughness: 0.42, metalness: 0.3, emissive: "#3a2a10" });   /* r26b: readable gold at night (metal 0.8 went black) */
  const stackA: THREE.Mesh[] = [], stackB: THREE.Mesh[] = [];
  /* r42: 18 coins against 9, narrower (the lit top ellipses made 12 against 6 read as three quarters) */
  for (let i = 0; i < 18; i++) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.011, 24), coinM); a.position.set(-0.21 + (i % 3) * 0.002, 0.826 + i * 0.0115, -0.62); a.rotation.y = i; root.add(a); stackA.push(a);   /* r76: in from the left edge (it was cut) */ const bb = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.011, 24), coinM); bb.position.set(0.31 - (i % 3) * 0.002, 0.826 + i * 0.0115, -0.66);   /* r51: in from the Shorts buttons */   /* r26: the two coin stacks sit at the near desk corners, in frame (last year full, this year halving) */ bb.rotation.y = i * 0.7; root.add(bb); stackB.push(bb); }
  { const sb = new THREE.Group(); sb.position.set(1.9, 0, -1.6); root.add(sb); const iron = lam("rmIron", () => ({ color: "#3a3a44" })); sb.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.5).translate(0, 0.25, 0), iron)); sb.add(new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.06, 0.52).translate(0, 0.42, 0), lam("rmBrass", () => ({ color: "#c8a04a" })))); }
  /* r47: desk and wall dressing (the office read as one bookshelf and a lamp): a tied bundle of tax papers, an hourglass, a
   *  sealing stamp, and the framed excise warrant on the wall between the shelves and the window */
  { const pap = lam("rmPapers", () => ({ map: ctex("rmPaperT", 128, 128, (g, rr) => { g.fillStyle = "#efe6cf"; g.fillRect(0, 0, 128, 128); g.fillStyle = "rgba(60,40,20,0.35)"; for (let y = 18; y < 120; y += 9) g.fillRect(14, y, 70 + rr() * 30, 2); }) }));
    for (let i = 0; i < 6; i++) { const sh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.008, 0.17), pap); sh.position.set(0.6 + (i % 2) * 0.012, 0.824 + i * 0.009, -0.66 - (i % 3) * 0.008); sh.rotation.y = 0.18 + ((i * 5) % 3 - 1) * 0.06; sh.castShadow = true; root.add(sh); }
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.19), lam("rmRibbon", () => ({ color: "#9a1e1a" }))); rib.position.set(0.6, 0.85, -0.67); rib.rotation.y = 0.18; root.add(rib);
    const hg = new THREE.Group(); hg.position.set(0.78, 0.82, -1.0); root.add(hg); const hw = lam("rmHgWood", () => ({ color: "#5a3a22" })), hgl = lam("rmHgSand", () => ({ color: "#d8b878" }));
    for (const y of [0.0, 0.22]) hg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12).translate(0, y + 0.01, 0), hw));
    for (const a of [0, 2.1, 4.2]) hg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 5).translate(Math.cos(a) * 0.05, 0.12, Math.sin(a) * 0.05), hw));
    hg.add(new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 12).translate(0, 0.065, 0), hgl)); hg.add(new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 12).rotateX(Math.PI).translate(0, 0.175, 0), lam("rmHgGlass", () => ({ color: "#e6ead8" }))));
    const st = new THREE.Group(); st.position.set(0.36, 0.82, -1.02); root.add(st); st.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.03, 12).translate(0, 0.015, 0), lam("rmBrass", () => ({ color: "#c8a04a" })))); st.add(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.1, 8).translate(0, 0.08, 0), lam("rmHgWood", () => ({ color: "#5a3a22" })))); st.add(new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8).translate(0, 0.14, 0), lam("rmHgWood", () => ({ color: "#5a3a22" }))));
    const wt = ctex("rmWarrant1", 256, 340, (g) => { g.fillStyle = "#efe2c2"; g.fillRect(0, 0, 256, 340); g.strokeStyle = "#8a6a3a"; g.lineWidth = 6; g.strokeRect(14, 14, 228, 312);
      g.fillStyle = "#2a1a10"; g.textAlign = "center"; g.font = "900 34px Georgia, serif"; g.fillText("EXCISE", 128, 70); g.font = "italic 700 24px Georgia, serif"; g.fillText("Warrant", 128, 104);
      g.fillStyle = "rgba(42,26,16,0.5)"; for (let y = 130; y < 250; y += 14) g.fillRect(40, y, 176, 3);
      g.fillStyle = "#a8201c"; g.beginPath(); g.arc(128, 286, 26, 0, Math.PI * 2); g.fill(); g.fillStyle = "#e8b84a"; g.font = "900 20px Georgia, serif"; g.fillText("GR", 128, 293); });
    const wf = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.52, 0.03), lam("rmFrameDk", () => ({ color: "#4a2e1a" }))); wf.position.set(0.3, 1.78, -2.17); root.add(wf);
    const wp = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.46), new THREE.MeshLambertMaterial({ map: wt })); wp.position.set(0.3, 1.78, -2.152); root.add(wp); }
  /* r40: soft contact shadows under the two coin stacks (they floated over the desk) */
  { const cs = new THREE.MeshBasicMaterial({ map: ctex("rmCoinSh", 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, "rgba(16,8,4,0.8)"); gr.addColorStop(0.5, "rgba(16,8,4,0.4)"); gr.addColorStop(1, "rgba(16,8,4,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }), transparent: true, depthWrite: false });
    for (const [x, zz] of [[-0.21, -0.62], [0.22, -0.66]]) { const q = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.16).rotateX(-Math.PI / 2), cs); q.position.set(x, 0.8215, zz); q.renderOrder = 2; root.add(q); } }
  barrel(root, [-2.1, 0, 1.4], 0.36);
  const fill = new THREE.PointLight("#9ab0e0", 0.9, 8, 1.2);   /* r76i: less even fill - the candle side and the dark side read (reviewer: an even warm fill) */   /* r76f: a bluer night room round the candle pool (eight warm frames in a row) */ fill.position.set(-1.0, 1.9, 1.4);   /* r53: halved (night, not day) */   /* r26: a cool night fill (the room read all orange) */ root.add(fill);
  // cool moonlight fill from the window side + a second candle on the shelf (warm key vs cool fill)
  const cool = new THREE.PointLight("#7a9cc4", 1.4, 9, 1.2); cool.position.set(1.8, 2.0, 0.9); root.add(cool);   /* r53: 1.8 -> 1.0 */
  const candle2 = lamp(root, [-1.7, 1.27, -2.05], "#ffb45a", 0.4, 4, "table");   /* r57: halved - one warm pool at the desk */
  b.build(root);
  root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !m.layers.isEnabled(NOINK)) { m.receiveShadow = true; if (!(m.material as THREE.Material).transparent) m.castShadow = true; } });
  let key = "";
  return {
    name: "office", root, title: [ledger],
    marks: { tax: [0, 0, -1.45], taxDoor: [1.8, 0, 1.4] },
    cams: { desk: { pos: [0.2, 1.45, 1.2], look: [0, 1.05, -0.9], fov: 46 }, page: { pos: [0.02, 1.55, -0.1], look: [0, 0.84, -0.56], fov: 40 } },
    pose: (t, c) => {
      flicker(candle, t); flicker(candle2, t + 1.3); candle.userData.base = 5.5 * (c.candle ?? 1);   /* r53 */
      // the page mesh's material is swapped for a lit one by realify(): set the map on whatever it carries now
      const L = c.ledger ?? 1, n = Math.round(L < 0.6 ? (L / 0.6) * 3 : 3), tot = L > 0.85, k = `${n}_${tot}`;
      if (k !== key) { const pm = (ledger.userData.pages as THREE.Mesh).material as THREE.MeshStandardMaterial; pm.map = ledgerTex(n, tot); if (pm.emissive) { pm.emissive.set("#8a7448"); pm.emissiveMap = pm.map; pm.emissiveIntensity = 0.5; pm.roughness = 0.85; } pm.needsUpdate = true; key = k; }   // r5b: warm cream paper under the lamp (it read grey)
      const half = cl(c.coins ?? 0); stackB.forEach((m, i) => { m.visible = i < 18 - Math.round(half * 9); });
      void stackA;
    },
  };
};

export const INN = { COUNTER_Z: -2.1, BIGMUG: [-0.16, 0.97, -1.95] as V3,   /* r76i (both reviewers): further left again - in the push-in its foam covered Bess's mouth */   /* r42: a step left (its rim touched Bess's head) */  DOOR_X: 4.2, NOTICE: [3.95, 1.55, -0.3] as V3, BOOK: [1.2, 0.97, -1.95] as V3 };
const staveT0 = () => ctex("rmCaskStaves", 256, 128, (g) => { g.fillStyle = "#8a5630"; g.fillRect(0, 0, 256, 128); for (let i = 0; i < 16; i++) { g.fillStyle = ["#94603a", "#7e4c2a", "#a06a40", "#865430"][i % 4]; g.fillRect(0, i * 8 + 1, 256, 6.5); g.fillStyle = "#3a2010"; g.fillRect(0, i * 8, 256, 1); } });
export const inn = (): SetDef => {
  const root = new THREE.Group(), b = new Batch();
  const wall = lam("rmInWall4", () => ({ map: plaster("rmInWallT3", "#c4a06c"), color: "#a2a6ae" }))   /* r47: a darker lime wash (the back wall blew out cream across the top) */, wood = lam("rmInWood", () => ({ map: planksHD(), color: "#8a6444" })), beam = lam("rmInBeam", () => ({ map: beamHD(), color: "#6e4e34" }));
  const floor = lam("rmInFloorP", () => ({ map: rep(planksHD(), 1, 1), color: "#6e5c3c" }));   // r12: worn plank floor (the flags read as outlined pink tiles under the lamps)   // r6: worn brown flags (the light ones read pink under the lamps)
  b.add(quad(V(-4.2, 0, 3.2), V(4.2, 0, 3.2), V(4.2, 0, -3.2), V(-4.2, 0, -3.2), 3, 3), floor);
  b.add(boxGeo(V(-4.5, 0, -3.5), V(4.5, 3.0, -3.2), 1), wall); b.add(boxGeo(V(-4.5, 0, -3.5), V(-4.2, 3.0, 3.5), 1), wall); b.add(boxGeo(V(-4.5, 0, 3.2), V(4.5, 3.0, 3.5), 1), wall);
  // right wall with the door gap (z 0.6..1.8, h 2.25)
  b.add(boxGeo(V(4.2, 0, -3.5), V(4.5, 3.0, 0.6), 1), wall); b.add(boxGeo(V(4.2, 0, 1.8), V(4.5, 3.0, 3.5), 1), wall); b.add(boxGeo(V(4.2, 2.25, 0.6), V(4.5, 3.0, 1.8), 1, true), wall);
  b.add(boxGeo(V(-4.5, 3.0, -3.5), V(4.5, 3.1, 3.5), 1, true), wood); for (const z of [-1.6, 0.4, 2.2]) b.add(boxGeo(V(-4.2, 2.74, z - 0.14), V(4.2, 3.0, z + 0.14), 1, true), beam);
  for (const [x, z] of [[-4.15, -3.15], [4.15, -3.15], [-4.15, 3.15]]) b.add(boxGeo(V(x - 0.12, 0, z - 0.12), V(x + 0.12, 3.0, z + 0.12)), beam);
  // the bar counter, the shelves of tankards behind, the chalkboard
  b.add(boxGeo(V(-2.6, 0, -2.3), V(2.2, 0.9, -1.8), 1), wood); b.add(boxGeo(V(-2.7, 0.9, -2.35), V(2.3, 0.96, -1.72), 1), beam);
  /* r76i (reviewer: the bar front read as flat red planks): a panelled front - dark stiles and rails framing each panel, and a brass foot rail on brackets */
  for (let x = -2.6; x <= 2.21; x += 0.8) b.add(boxGeo(V(x - 0.045, 0.04, -1.8), V(x + 0.045, 0.88, -1.765)), beam);
  for (const [y0, y1] of [[0.04, 0.14], [0.78, 0.88]]) b.add(boxGeo(V(-2.6, y0, -1.8), V(2.2, y1, -1.765)), beam);
  { const brass = lam("rmInBrass", () => ({ color: "#c8a050", emissive: "#2a1a08" })); for (const [x0, x1] of [[-2.55, -1.95], [-1.12, 0.62], [1.32, 2.15]]) { b.add(new THREE.CylinderGeometry(0.022, 0.022, x1 - x0, 10).rotateZ(Math.PI / 2).translate((x0 + x1) / 2, 0.2, -1.62), brass);   /* broken round the two kegs */
      for (const x of [x0 + 0.05, x1 - 0.05]) b.add(new THREE.BoxGeometry(0.03, 0.03, 0.16).translate(x, 0.2, -1.7), brass); } }   /* r71: the counter at waist height, 0.96 (at 1.11 it came up to Amos's chin) */
  // r13: dull pewter (the chrome mirrored the lavender wall)
  const pewter = new THREE.MeshStandardMaterial({ color: "#a8a69c", roughness: 0.62, metalness: 0.3 });
  const mugGeo = (s = 1) => { const g = new THREE.CylinderGeometry(0.06 * s, 0.07 * s, 0.16 * s, 18, 1, true).translate(0, 0.08 * s, 0); return g; };
  for (const y of [1.55, 2.0]) { b.add(boxGeo(V(-1.5, y, -3.2), V(-0.34, y + 0.04, -2.9)), wood); for (let i = 0; i < 3; i++) {   /* r22: the shelves stop short of the chalkboard */ const sc = 0.85 + 0.15 * (((i * 7 + Math.round(y * 10)) % 3) / 2); const mm = [pewter, lam("rmClayMug", () => ({ color: "#9a5a3a" })), lam("rmPewterD", () => ({ color: "#7c7a74" })), lam("rmGreenMug", () => ({ color: "#5a7a5a" }))][(i + Math.round(y * 3)) % 4]; const m = new THREE.Mesh(mugGeo(sc * (0.9 + 0.12 * ((i * 5) % 3))), mm); (mm as THREE.Material).side = THREE.DoubleSide; m.position.set(-1.32 + i * 0.36 + ((i * 3) % 2) * 0.03, y + 0.04, -3.02);   /* r21: four mug kinds */ m.rotation.y = -0.4 + i * 0.25; root.add(m); const h = new THREE.Mesh(new THREE.TorusGeometry(0.045 * sc, 0.012, 6, 12, Math.PI).rotateZ(-Math.PI / 2), pewter); h.position.set(0.064 * sc, 0.085 * sc, 0); m.add(h); } }
  const chalk = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.68), new THREE.MeshBasicMaterial({ map: chalkTex(), toneMapped: true })); chalk.position.set(0.2, 2.25, -3.17);   /* r47: smaller and higher (the barmaid's head covered its corner) */ root.add(chalk);
  for (let i = 0; i < 3; i++) barrel(root, [-3.4, 0, -2.6 + i * 0.85], 0.46, i);
  /* r54: a peg rail of hanging tankards and a framed picture on the upper back wall (reviewers: a third of the inn frame was bare plaster) */
  { b.add(boxGeo(V(-2.9, 2.74, -3.2), V(2.3, 2.8, -3.1)), beam); const clayMug = lam("rmClayMug", () => ({ color: "#9a5a3a" }));
    for (const x of [-2.6, -2.32, -2.04, -1.78, 0.92, 1.2, 1.5, 1.8, 2.08]) { const k = Math.round(x * 10) % 3, m = k === 0 ? clayMug : pewter;
      b.add(new THREE.CylinderGeometry(0.008, 0.008, 0.07, 5).translate(x, 2.705, -3.13), beam);
      const mg = mugGeo(0.85 + 0.1 * k).rotateX(Math.PI).translate(x, 2.68, -3.08); b.add(mg, m); }
    const pic = ctex("rmInPic1", 256, 192, (g, r) => { const gr = g.createLinearGradient(0, 0, 0, 192); gr.addColorStop(0, "#7a9cc8"); gr.addColorStop(0.55, "#d8c89a"); gr.addColorStop(0.56, "#3a6a8a"); gr.addColorStop(1, "#24485e"); g.fillStyle = gr; g.fillRect(0, 0, 256, 192);
      g.fillStyle = "#5a3a22"; g.beginPath(); g.moveTo(70, 112); g.lineTo(190, 112); g.lineTo(172, 132); g.lineTo(86, 132); g.fill(); g.fillStyle = "#f2ead6"; g.beginPath(); g.moveTo(128, 40); g.lineTo(128, 108); g.lineTo(84, 108); g.fill(); g.beginPath(); g.moveTo(134, 50); g.lineTo(134, 108); g.lineTo(170, 108); g.fill();
      g.strokeStyle = "rgba(255,255,255,0.4)"; for (let i = 0; i < 9; i++) { g.beginPath(); const y = 140 + r() * 40, x = r() * 230; g.moveTo(x, y); g.lineTo(x + 20, y); g.stroke(); } });
    const fr = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.38, 0.03), beam); fr.position.set(-0.98, 2.47, -3.15); root.add(fr);
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), new THREE.MeshLambertMaterial({ map: pic })); pm.position.set(-0.98, 2.47, -3.13); root.add(pm); }
  /* r60: sawdust and straw on the inn floor near the lens (reviewer: the bottom tenth was bare planks) */
  { const rs = rng(6061), dust = lam("rmSawdust2", () => ({ color: "#a88a5e" })), straw = lam("rmStraw2", () => ({ color: "#b8984e" }));
    for (let i = 0; i < 90; i++) { const x = -1.5 + rs() * 2.3, z = -1.55 + rs() * 1.5; if (Math.hypot(x + 0.7, z + 1.17) < 0.28) continue; const sc = 0.008 + rs() * 0.016; b.add(new THREE.BoxGeometry(sc * 1.6, 0.002, sc).rotateY(rs() * 3).translate(x, 0.002, z), dust); }
    for (let i = 0; i < 22; i++) { const x = -1.4 + rs() * 2.1, z = -1.5 + rs() * 1.4; if (Math.hypot(x + 0.7, z + 1.17) < 0.28) continue; b.add(new THREE.CylinderGeometry(0.0025, 0.0025, 0.09 + rs() * 0.08, 4).rotateZ(Math.PI / 2).rotateY(rs() * 3).translate(x, 0.004, z), straw); } }
  /* r60: a low shelf of bottles behind the bar (reviewer: the strip of back wall over the bar read as bare beige plaster) */
  { b.add(boxGeo(V(-1.55, 1.2, -3.14), V(-0.2, 1.235, -2.96)), beam); const glassG = lam("rmBottleG", () => ({ color: "#2e5a3a", emissive: "#0c1a10" })), glassB = lam("rmBottleB", () => ({ color: "#5a3a1e", emissive: "#1a0e06" })), cork = lam("rmCork", () => ({ color: "#c8a070" }));
    for (let i = 0; i < 9; i++) { const x = -1.47 + i * 0.145 + (i % 3) * 0.012, h = 0.2 + (i % 4) * 0.025, m = i % 3 === 1 ? glassB : glassG;
      b.add(new THREE.CylinderGeometry(0.038, 0.04, h, 12).translate(x, 1.235 + h / 2, -3.04), m); b.add(new THREE.CylinderGeometry(0.014, 0.024, 0.07, 10).translate(x, 1.235 + h + 0.035, -3.04), m); b.add(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8).translate(x, 1.235 + h + 0.08, -3.04), cork); } }
  // r13: half-timbering + a wood dado on the back wall, and a night window (cool blue-grey) right of the chalkboard
  for (const x of [-2.9, -1.62, 1.28, 2.3]) b.add(boxGeo(V(x - 0.08, 0, -3.2), V(x + 0.08, 2.74, -3.14)), beam);
  b.add(boxGeo(V(-4.2, 0, -3.2), V(4.2, 0.95, -3.16), 1), wood); b.add(boxGeo(V(-4.2, 0.93, -3.2), V(4.2, 0.99, -3.12), 1), beam);
  { const win = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.8), new THREE.MeshBasicMaterial({ map: ctex("rmInWin2", 128, 160, (g) => { const gr = g.createLinearGradient(0, 0, 0, 160); gr.addColorStop(0, "#0e1838"); gr.addColorStop(1, "#24386a"); g.fillStyle = "#f2ecd0"; g.beginPath(); g.arc(34, 40, 9, 0, 6.3); g.fill(); g.fillStyle = gr; g.fillRect(0, 0, 128, 160); g.fillStyle = "#e8e0cc"; g.fillRect(0, 0, 128, 8); g.fillRect(0, 152, 128, 8); g.fillRect(0, 0, 8, 160); g.fillRect(120, 0, 8, 160); g.fillRect(60, 0, 8, 160); g.fillRect(0, 76, 128, 8); }), toneMapped: true })); win.position.set(1.62, 1.7, -3.15); root.add(win);
    const winL = new THREE.PointLight("#86a4e0", 2.5, 4.5, 1.4); winL.position.set(1.25, 1.6, -2.55); root.add(winL); }
  // the fireplace (left wall), fire + glow + light
  b.add(boxGeo(V(-4.2, 0, -0.9), V(-3.7, 1.5, 0.9)), lam("rmFireSt", () => ({ map: stoneHD("rmFireStT") }))); b.add(boxGeo(V(-4.25, 1.5, -1.05), V(-3.6, 1.62, 1.05), 0, true), beam);
  const hearth = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.9).rotateY(Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#1a1210" })); hearth.position.set(-3.69, 0.5, 0); root.add(hearth);
  const fireM = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.3, 0.4), toneMapped: true });
  const flames: THREE.Mesh[] = []; for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.1 + (i % 2) * 0.04, 0.42, 7), fireM); f.position.set(-3.85, 0.25, -0.3 + i * 0.15); f.layers.set(NOINK); root.add(f); flames.push(f); }
  b.add(boxGeo(V(-3.95, 0.02, -0.4), V(-3.75, 0.1, 0.4)), lam("rmLog", () => ({ color: "#5a3a24" })));
  const fireL = new THREE.PointLight("#ff9a4a", 7, 8, 1.4); fireL.position.set(-3.4, 0.7, 0); root.add(fireL); glow(root, [-3.75, 0.45, 0], "#ff9a4a", 1.6, 0.8);
  // tables + benches, a few mugs on them
  for (const [x, z] of [[-1.6, 0.8], [1.2, 1.4]] as [number, number][]) { b.add(boxGeo(V(x - 0.7, 0.72, z - 0.45), V(x + 0.7, 0.78, z + 0.45)), wood); for (const s of [-1, 1]) { b.add(boxGeo(V(x + s * 0.6 - 0.05, 0, z - 0.05), V(x + s * 0.6 + 0.05, 0.72, z + 0.05)), beam); b.add(boxGeo(V(x - 0.7, 0.42, z + s * 0.75 - 0.15), V(x + 0.7, 0.46, z + s * 0.75 + 0.15)), wood); } const m = new THREE.Mesh(mugGeo(), pewter); m.position.set(x + 0.2, 0.78, z); root.add(m); }
  // the door (hinged at z 1.8), the sunset lane beyond, the notice post beside it
  const doorG = new THREE.Group(); doorG.position.set(4.3, 0, 1.8); root.add(doorG);
  { const d = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.2, 1.2).translate(0, 1.1, -0.6), wood); d.castShadow = true; doorG.add(d); doorG.add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6).translate(-0.06, 1.05, -1.05), lam("rmBrass", () => ({ color: "#c8a04a" })))); }
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.4), new THREE.MeshBasicMaterial({ map: sunsetWin(), toneMapped: true })); outside.rotation.y = -Math.PI / 2; outside.position.set(4.9, 1.2, 1.2); root.add(outside);
  const sunIn = new THREE.SpotLight("#ffb46a", 0, 9, 0.5, 0.6, 1.2); sunIn.position.set(5.6, 1.6, 1.2); sunIn.target.position.set(2.0, 0, 1.0); root.add(sunIn, sunIn.target);
  b.add(boxGeo(V(4.05, 0.9, -0.85), V(4.2, 2.15, 0.25)), beam);
  const notice = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.86), new THREE.MeshBasicMaterial({ map: actTex(), toneMapped: true })); notice.rotation.y = -Math.PI / 2; notice.position.set(...INN.NOTICE); root.add(notice);
  // the law book on the counter (opens with c.book), the giant tankard (grows with c.bigMug)
  const book = new THREE.Group(); book.position.set(...INN.BOOK); root.add(book);
  const bookPages = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: bookTex(), toneMapped: true })); bookPages.position.y = 0.045; book.add(bookPages);
  const bookCover = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.04, 0.42), lam("rmBookCov", () => ({ color: "#3a2418" }))); bookCover.position.y = 0.02; book.add(bookCover);
  const bookClosed = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.42), lam("rmBookCov", () => ({ color: "#3a2418" }))); bookClosed.position.set(0.16, 0.06, 0); book.add(bookClosed);
  const big = new THREE.Group(); big.position.set(...INN.BIGMUG); big.rotation.y = -0.5; root.add(big);   /* r76i (reviewer: a hooped tub with no handle read as a barrel): the handle in profile on the free side */   // r9: the handle faces Amos (his mug), away from Bess
  { // r20: a wooden tankard - staves, iron hoops, a thick wooden handle (the pewter cylinder read as a bin)
    const staveT = ctex("rmStaves", 256, 128, (g, r) => { g.fillStyle = "#8a5630"; g.fillRect(0, 0, 256, 128); for (let i = 0; i < 12; i++) { const x = i * 21.3; g.fillStyle = ["#94603a", "#7e4c2a", "#a06a40", "#865430"][i % 4]; g.fillRect(x + 1.5, 0, 18.5, 128); for (let k = 0; k < 6; k++) { g.strokeStyle = "rgba(60,30,14,0.35)"; g.lineWidth = 1; g.beginPath(); const xx = x + 3 + r() * 14; g.moveTo(xx, 0); g.bezierCurveTo(xx + (r() - 0.5) * 6, 40, xx + (r() - 0.5) * 6, 90, xx + (r() - 0.5) * 4, 128); g.stroke(); } g.fillStyle = "rgba(255,220,170,0.18)"; g.fillRect(x + 2, 0, 3, 128); g.fillStyle = "#3a2010"; g.fillRect(x, 0, 1.6, 128); } });
    const staveM = lam("rmStaveM", () => ({ map: staveT, side: THREE.DoubleSide }));
    const body = new THREE.Mesh(mugGeo(), staveM); big.add(body);
    const inner = new THREE.Mesh(new THREE.CircleGeometry(0.06, 18).rotateX(-Math.PI / 2).translate(0, 0.004, 0), lam("rmMugBot", () => ({ color: "#5a3418" }))); big.add(inner); const ale = new THREE.Mesh(new THREE.CircleGeometry(0.062, 18).rotateX(-Math.PI / 2).translate(0, 0.15, 0), lam("rmAle", () => ({ color: "#c88a2a" }))); big.add(ale); const foam = new THREE.Mesh(new THREE.SphereGeometry(0.066, 14, 6, 0, TAU, 0, Math.PI / 2).scale(1, 0.4, 1).translate(0, 0.152, 0), lam("rmFoam", () => ({ color: "#fbf6ea" }))); big.add(foam); const h = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.016, 8, 14, Math.PI).rotateZ(-Math.PI / 2), lam("rmHandle", () => ({ color: "#6e4224" }))); h.position.set(0.066, 0.085, 0); big.add(h); big.userData.foam = foam; }
  // r13: dark bands and a rolled rim on the big tankard (it read as a featureless cylinder)
  for (const y of [0.02, 0.08, 0.15]) { const band = new THREE.Mesh(new THREE.TorusGeometry(y > 0.1 ? 0.0625 : 0.0695, 0.0045, 6, 28).rotateX(Math.PI / 2).translate(0, y, 0), lam("rmBand", () => ({ color: "#3e3a38" }))); big.add(band); }
  const small = new THREE.Group(); small.position.set(INN.BIGMUG[0] + 0.44, INN.BIGMUG[1], INN.BIGMUG[2] + 0.16); small.rotation.y = 2.89; root.add(small);   // r20: a normal wooden mug right beside the giant one (same look, a third the size)
  { small.add(new THREE.Mesh(mugGeo(), lam("rmStaveM", () => ({ color: "#8a5630" })))); small.add(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.016, 8, 14, Math.PI).rotateZ(-Math.PI / 2).translate(0.066, 0.085, 0), lam("rmHandle", () => ({ color: "#6e4224" })))); for (const y of [0.02, 0.15]) small.add(new THREE.Mesh(new THREE.TorusGeometry(y > 0.1 ? 0.0625 : 0.0695, 0.0045, 6, 28).rotateX(Math.PI / 2).translate(0, y, 0), lam("rmBand", () => ({ color: "#3e3a38" })))); small.add(new THREE.Mesh(new THREE.SphereGeometry(0.066, 14, 6, 0, TAU, 0, Math.PI / 2).scale(1, 0.4, 1).translate(0, 0.152, 0), lam("rmFoam", () => ({ color: "#fbf6ea" })))); }
  // r20: back-wall dressing - a hops garland along the top beam, a cask on a cradle with a tap, pegs with a coat and a hat
  { const hop = lam("rmHops", () => ({ color: "#7a9a48" })), hopD = lam("rmHopsD", () => ({ color: "#5a7a34" })); const hr = rng(77);
    const hopCard = lam("rmHopCard", () => ({ map: leafCut("hops", "#6e9a40", "#9ac25a", "#4a7030"), alphaTest: 0.5, side: THREE.DoubleSide } as THREE.MeshLambertMaterialParameters)); void hop; void hopD;
    for (let x = -2.8; x < 2.3; x += 0.16) { const y = 2.6 - 0.12 * Math.sin(((x + 2.8) / 1.27) * Math.PI) ** 2; b.add(new THREE.PlaneGeometry(0.3, 0.2).rotateZ((hr() - 0.5) * 0.6).translate(x, y + (hr() - 0.5) * 0.04, -3.06 + hr() * 0.03), hopCard); }   // r21: leafy hop bines (the hexagon balls read as placeholder)
    const caskG = new THREE.Group(); caskG.position.set(1.85, 1.11, -2.75); root.add(caskG);
    caskG.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.42, 16).rotateZ(Math.PI / 2).translate(0, 0.24, 0), lam("rmCaskW", () => ({ map: staveT0(), color: "#c08a5a" }))));
    for (const x of [-0.17, 0.17]) caskG.add(new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.008, 6, 24).rotateY(Math.PI / 2).translate(x, 0.24, 0), lam("rmBand", () => ({ color: "#3e3a38" }))));
    caskG.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.3).translate(0, 0.03, 0), beam));
    caskG.add(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.1, 6).rotateZ(Math.PI / 2).translate(-0.24, 0.16, 0.0), lam("rmBrass", () => ({ color: "#c8a04a" }))));
    for (const [x, col] of [[-2.25, "#5a3a2a"], [-2.05, "#3a4a6a"]] as [number, string][]) { b.add(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 5).rotateX(Math.PI / 2).translate(x, 1.62, -3.1), beam); b.add(new THREE.BoxGeometry(0.2, 0.5, 0.04).translate(x, 1.38, -3.08), lam("rmCoat" + col, () => ({ color: col }))); }
  }
  // r20: a stool and a small keg by the bar front (the floor read as an empty band)
  { const sg = new THREE.Group(); sg.position.set(0.95, 0, -1.25); root.add(sg); sg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.05, 14).translate(0, 0.62, 0), wood)); for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU; sg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.62, 6).rotateZ(Math.cos(a) * 0.12).rotateX(Math.sin(a) * 0.12).translate(Math.cos(a) * 0.12, 0.31, Math.sin(a) * 0.12), beam)); }
    barrel(root, [-1.55, 0, -1.35], 0.34, 5); }   // r12: the normal mug on Amos's side
  /* r26f: two kegs against the bar front between Amos and the stool (the bar front read as plain planks) */
  barrel(root, [0.98, 0, -1.55], 0.26, 2);   /* r43: further right (it sat mid-frame under the caption) */   /* r26i: one keg, out at the right (two in the centre sat under the caption) */
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.006, 18), new THREE.MeshStandardMaterial({ map: coinTex(), roughness: 0.3, metalness: 0.8 })); coin.position.set(INN.BIGMUG[0] - 0.15, 1.115, INN.BIGMUG[2] + 0.2); root.add(coin);
  const lanterns = [lamp(root, [-0.42, 2.3, -1.9], "#ffb45a", 4.0, 6, "hang"), lamp(root, [1.8, 2.35, 0.4], "#ffb45a", 4, 7, "hang"), lamp(root, [1.75, 0.98, -1.95], "#ffb45a", 1.4, 3.5, "table")];
  { const rim = new THREE.PointLight("#ffb070", 2.4, 3.6, 1.6); rim.position.set(-1.35, 1.7, -0.85); root.add(rim); }   // r8: a warm rim on Amos at the bar
  /* r76i (both reviewers: "the evening inn is lit like noon - no lamp pool, no key/shade split"): the hanging lamp over the bar
   *  throws a real warm pool on the bar top and the drinkers in front of it; the room round it falls off */
  { const pool = new THREE.SpotLight("#ffb862", 16, 5.5, 0.75, 0.85, 1.5); pool.position.set(-0.42, 2.25, -1.9); pool.target.position.set(-0.7, 0.8, -1.1); pool.castShadow = true; pool.shadow.mapSize.set(1024, 1024); pool.shadow.bias = -0.0008; root.add(pool, pool.target); }
  const dusk = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), new THREE.MeshBasicMaterial({ map: nightWin(), toneMapped: true })); dusk.position.set(-2.4, 1.75, -3.17); root.add(dusk);
  for (const [x0, x1, y0, y1] of [[-2.87, -2.83, 1.15, 2.35], [-1.97, -1.93, 1.15, 2.35], [-2.87, -1.93, 2.35, 2.41], [-2.92, -1.88, 1.09, 1.15], [-2.43, -2.37, 1.15, 2.35]] as const) b.add(boxGeo(V(x0, y0, -3.18), V(x1, y1, -3.12)), lam("rmFrame", () => ({ color: "#efe6d2" })));
  const coolIn = new THREE.PointLight("#5a7ae0", 2.6, 9, 1.0); coolIn.position.set(-2.0, 1.7, -1.8); root.add(coolIn); const coolIn2 = new THREE.PointLight("#5a7ae0", 1.6, 8, 1.0); coolIn2.position.set(3.4, 1.6, 2.4); root.add(coolIn2);
  b.build(root);
  root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !m.layers.isEnabled(NOINK)) { m.receiveShadow = true; if (!(m.material as THREE.Material).transparent) m.castShadow = true; } });
  const steamPuffs = [0, 1].map(() => mist(root, [0, 0, 0], 0.2, "#ffffff", 0)); void steamPuffs; void sm;
  return {
    name: "inn", root, title: [big],
    marks: { barman: [0.65, 0, -2.75], drinker: [-0.85, 0, -1.3], drinker2: [-1.6, 0, 1.6], drinker3: [1.2, 0, 2.2], crier: [3.5, 0, -0.4], door: [3.7, 0, 1.2], amosInn: [2.4, 0, 0.2] },
    cams: { bar: { pos: [0.3, 1.5, 1.6], look: [0.2, 1.25, -2.0], fov: 50 }, door: { pos: [1.2, 1.55, 0.3], look: [4.2, 1.4, 0.6], fov: 50 }, mug: { pos: [0.55, 1.3, -1.2], look: [0.4, 1.2, -1.95], fov: 40 } },
    pose: (t, c) => {
      lanterns.forEach((l) => flicker(l, t));
      flames.forEach((f, i) => { const k = 0.85 + 0.25 * Math.sin(t * 11 + i * 2.1) * Math.sin(t * 4.3 + i); f.scale.set(1, k, 1); f.position.y = 0.21 * k + 0.04; });
      fireL.intensity = 7 * (0.9 + 0.1 * Math.sin(t * 9) * Math.sin(t * 3.7));
      const d = sm(c.door ?? 0); doorG.rotation.y = -d * 1.6; sunIn.intensity = 26 * d;
      const a = c.act ?? 1; notice.visible = a > 0.01; notice.position.y = INN.NOTICE[1] + (1 - sm(a)) * 0.06; notice.rotation.z = (1 - sm(a)) * 0.12;
      const bk = c.book ?? 1; bookPages.visible = bookCover.visible = bk > 0.5; bookClosed.visible = bk <= 0.5;
      const g = c.bigMug ?? 1, s = 1 + sm(g) * 2.2; big.scale.set(s, s, s); big.position.set(...INN.BIGMUG);
      // r5: c.bigLift (-1 = not here yet, 0..1 = Amos heaves it up from his chest onto the bar on an arc, 1 = on the bar)
      const bl = c.bigLift ?? 1; big.visible = bl >= 0;
      if (bl >= 0 && bl < 1) { const k = sm(bl); big.position.set(INN.BIGMUG[0] - 0.25 * (1 - k), lerp(0.62, INN.BIGMUG[1], k) + 0.22 * Math.sin(Math.PI * k), lerp(-1.42, INN.BIGMUG[2], k)); }
      coin.visible = (c.penny ?? 1) > 0;
      (big.userData.foam as THREE.Mesh).visible = (c.ale ?? 1) > 0.5;
    },
  };
};
