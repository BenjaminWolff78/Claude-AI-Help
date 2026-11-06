
// =====================================================================================================================
// "He Labeled Grape Bricks 'Don't Make Wine' and Beat Prohibition": shared staging. Positions come from the set marks
// (vineyard = the road set's VINE variant, kitchen, office). Accent grape violet #9B3FD0.
const MK = (s: SetDef, k: string): V3 => (s.marks[k] ?? [0, 0, 0]) as V3;
const add3 = (a: V3, dx: number, dy: number, dz: number): V3 => [a[0] + dx, a[1] + dy, a[2] + dz];
const VIO = "#9b3fd0";
/** a laugh that shakes the body (phase advances ~2.5 shakes a second), head back */
const laughP = (f: number, a: number, i: number): P => ({ expr: i % 2 ? "guffaw" : "laugh", shake: 1, phase: (f - a) / 12 + i * 0.3, headBack: 0.5, tilt: -4 + 2 * Math.sin((f - a) * 0.7 + i) });
/** arm presets (shoulder-relative elbow, hand) */
const AR = {
  liftR: [[22, -2], [30, -26]] as A2, liftHiR: [[22, -10], [34, -38]] as A2, pointR: [[28, -6], [56, -12]] as A2, crankR: [[24, -8], [46, -30]] as A2,
  carryR: [[24, 26], [12, 40]] as A2, holdR: [[20, 14], [30, 2]] as A2, shrugR: [[30, 4], [40, -10]] as A2, shrugL: [[-30, 4], [-40, -10]] as A2,
  downR: [[18, 26], [30, 40]] as A2, slapR: [[26, 6], [44, 10]] as A2, hipR: [[26, 14], [10, 26]] as A2, hipL: [[-26, 14], [-10, 26]] as A2,
  tipHatR: [[22, -18], [8, -54]] as A2, waveR: [[26, -16], [40, -46]] as A2, stampUp: [[22, -16], [26, -46]] as A2, stampDown: [[24, 6], [30, 20]] as A2,
};
/** an illustration card (mini animation) that pops in with a 6 f ease and fades out; draw() gets the 2D context */
const popCard = (key: string, pos: V3, w: number, h: number, f: number, a: number, b: number, draw: (g: CanvasRenderingContext2D, k: number) => void, cw = 512, ch = 512): FxSpec | null => {
  if (f < a || f > b) return null;
  const kin = sm(f, a, a + 6), kout = 1 - sm(f, b - 6, b), k = Math.min(kin, kout), q = Math.round(k * 10) / 10;
  return { kind: "card", key: key + "_" + q + "_" + Math.floor((f - a) / 3), pos, w: w * (0.7 + 0.3 * kin), h: h * (0.7 + 0.3 * kin), flat: false, cw, ch,
    draw: (p) => { const g = p.g; g.globalAlpha = k; draw(g, (f - a) / Math.max(1, b - a)); g.globalAlpha = 1; } };
};
const inkRound = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, lw = 10) => {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  g.fillStyle = fill; g.fill(); g.lineWidth = lw; g.strokeStyle = INKC; g.stroke();
};
/** a wine bottle with a red "no" stamp that lands on frame `hit` (mini animation for "wine just became illegal") */
const noWine = (key: string, pos: V3, f: number, a: number, hit: number, b: number) => popCard(key, pos, 0.9, 0.9, f, a, b, (g) => {
  g.lineJoin = "round"; g.fillStyle = "#24503a"; g.strokeStyle = INKC; g.lineWidth = 12;
  g.beginPath(); g.moveTo(232, 60); g.lineTo(280, 60); g.lineTo(280, 150); g.quadraticCurveTo(340, 190, 340, 250); g.lineTo(340, 450); g.lineTo(172, 450); g.lineTo(172, 250); g.quadraticCurveTo(172, 190, 232, 150); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#fbf3dc"; g.fillRect(190, 290, 132, 92); g.strokeRect(190, 290, 132, 92); g.fillStyle = "#6a2c7e"; g.font = "900 40px DejaVu Sans"; g.textAlign = "center"; g.fillText("WINE", 256, 350);
  if (f >= hit) { const s = 1 + 0.6 * (1 - sm(f, hit, hit + 5)); g.save(); g.translate(256, 256); g.scale(s, s); g.strokeStyle = "#e0303a"; g.lineWidth = 38; g.beginPath(); g.arc(0, 0, 190, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-134, -134); g.lineTo(134, 134); g.stroke(); g.restore(); }
});
/** "200 GALLONS": jug icons popping in a row, the counter ticking up to 200 (mini animation) */
const gallons = (key: string, pos: V3, f: number, a: number, b: number) => popCard(key, pos, 0.8, 0.4, f, a, b, (g) => {
  const n = Math.round(200 * sm(f, a + 4, a + 40)), jugs = Math.min(5, Math.floor(sm(f, a + 2, a + 36) * 5.99));
  for (let i = 0; i < jugs; i++) { const x = 40 + i * 92; g.fillStyle = "#d8ecf4"; g.strokeStyle = INKC; g.lineWidth = 7; g.fillRect(x, 70, 70, 96); g.strokeRect(x, 70, 70, 96); g.fillStyle = "#6a1f78"; g.fillRect(x + 6, 110, 58, 52); g.fillStyle = "#c9a27a"; g.fillRect(x + 22, 52, 26, 20); g.strokeRect(x + 22, 52, 26, 20); }
  inkRound(g, 96, 184, 320, 64, 22, VIO, 8); g.fillStyle = "#ffffff"; g.font = "900 46px DejaVu Sans"; g.textAlign = "center"; g.fillText(n + " GALLONS", 256, 232);
}, 512, 256);
/** a big red LEGAL stamp mark on the ruling paper (lands on `hit`) */
const legalMark = (pos: V3, f: number, hit: number): FxSpec | null => f < hit ? null : ({ kind: "card", key: "legalMk" + Math.min(6, f - hit), pos, w: 0.42, h: 0.21, flat: true, cw: 256, ch: 128,
  draw: (p) => { const g = p.g, s = 1 + 0.5 * (1 - sm(f, hit, hit + 4)); g.save(); g.translate(128, 64); g.scale(s, s); g.rotate(-0.12); g.strokeStyle = "#d4252e"; g.lineWidth = 9; g.strokeRect(-104, -44, 208, 88);
    g.fillStyle = "#d4252e"; g.font = "900 64px DejaVu Sans"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("LEGAL", 0, 4); g.restore(); } });
/** the cupboard calendar day for a quick 1 -> 21 flip over [a, b] */
const dayFlip = (f: number, a: number, b: number) => 1 + Math.round(20 * sm(f, a, b));
/** a world point `dist` m in front of the shot's camera, shifted dx right / dy up (m) in screen space (cards that must stay in frame) */
const camPt = (id: number, s: SetDef, f: number, dist: number, dx = 0, dy = 0): V3 => {
  const c = camAt(id, s, f), d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], L = Math.hypot(d[0], d[1], d[2]) || 1;
  const fw = [d[0] / L, d[1] / L, d[2] / L], rl = Math.hypot(fw[0], fw[2]) || 1, rt = [-fw[2] / rl, 0, fw[0] / rl];
  return [c.pos[0] + fw[0] * dist + rt[0] * dx, c.pos[1] + fw[1] * dist + dy, c.pos[2] + fw[2] * dist + rt[2] * dx];
};
